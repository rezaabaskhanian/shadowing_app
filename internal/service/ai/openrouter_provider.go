package aiservice

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"shadowing-backend/internal/pkg/richerror"
	settingsservice "shadowing-backend/internal/service/settings"
)

const openRouterChatCompletionsURL = "https://openrouter.ai/api/v1/chat/completions"

// openRouterDefaultModel وقتی ادمین چیزی توی OPENROUTER_MODEL نگذاشته استفاده می‌شود.
// روی OpenRouter همه‌ی مدل‌ها با یک کلید در دسترس‌اند و فقط این رشته عوض می‌شود
// (مثلاً google/gemini-3.8-flash، anthropic/claude-..., deepseek/deepseek-chat) —
// یعنی سوییچ بین Gemini/Claude/DeepSeek از پنل ادمین، بدون کلید جدا برای هرکدام.
const openRouterDefaultModel = "google/gemini-3.8-flash"

// openRouterProvider عمداً از deepseekProvider جداست، هرچند هر دو پروتکلِ Chat
// Completionsِ سازگار با OpenAI را حرف می‌زنند: فقط شکلِ عمومیِ درخواست/پاسخ
// (deepseekChatMessage/deepseekChatRequest/deepseekChatResponse، تعریف‌شده در
// deepseek_provider.go) را دوباره استفاده می‌کند، نه هیچ منطقِ اختصاصیِ DeepSeek
// (مثلاً خاموش‌کردنِ thinking، که پارامترِ خودِ DeepSeek است و به مدل‌های دیگر
// نباید فرستاده شود).
type openRouterProvider struct {
	settings *settingsservice.Service
}

func newOpenRouterProvider(settings *settingsservice.Service) *openRouterProvider {
	return &openRouterProvider{settings: settings}
}

func (p *openRouterProvider) apiKey() string {
	return p.settings.Get(settingsservice.KeyOpenRouterAPIKey)
}

func (p *openRouterProvider) model() string {
	model := p.settings.Get(settingsservice.KeyOpenRouterModel)
	if model == "" {
		return openRouterDefaultModel
	}
	return model
}

func (p *openRouterProvider) enabled() bool {
	return p.apiKey() != ""
}

// errOpenRouterUnparsable مثل errDeepseekUnparsable است اما جدا تعریف شده تا
// لاگ‌ها بین دو provider مخلوط نشوند و تشخیصِ اینکه کدام سرویس مشکل داشته روشن بماند.
var errOpenRouterUnparsable = errors.New("openrouter: unparsable response")

func openRouterUnparsable(op richerror.Op, stage string, status int, content, body, finishReason string, completionTokens int, cause error) error {
	slog.Warn("openrouter: unparsable response",
		"op", string(op), "stage", stage, "status", status,
		"raw", deepseekSnippet(content, 300), "body", deepseekSnippet(body, 1200),
		"finish_reason", finishReason, "completion_tokens", completionTokens, "cause", cause)
	return richerror.New(op).
		WithErr(fmt.Errorf("%w (%s): %v", errOpenRouterUnparsable, stage, cause)).
		WithMessage("پاسخ مدل (OpenRouter) قابل پردازش نبود")
}

// call یک درخواستِ Chat Completions به OpenRouter می‌زند و پاسخِ خام را برمی‌گرداند.
// خطاهای HTTP/وضعیت اینجا مدیریت می‌شوند؛ تفسیرِ content (JSON/متنِ خالی) به‌عهده‌ی
// هر متد است، چون هر کدام قرارداد پاسخِ متفاوتی دارند.
func (p *openRouterProvider) call(ctx context.Context, op richerror.Op, systemPrompt string, messages []deepseekChatMessage) (deepseekChatResponse, []byte, error) {
	return p.callWithMaxTokens(ctx, op, systemPrompt, messages, deepseekDefaultMaxTokens)
}

// callWithMaxTokens مثل call است ولی سقفِ توکنِ خروجی را صریح می‌گیرد؛ برای
// خروجی‌های بلند (تولید صحنه) که با سقفِ عمومیِ ۲۰۴۸ بریده می‌شدند.
func (p *openRouterProvider) callWithMaxTokens(ctx context.Context, op richerror.Op, systemPrompt string, messages []deepseekChatMessage, maxTokens int) (deepseekChatResponse, []byte, error) {
	key := p.apiKey()
	if key == "" {
		return deepseekChatResponse{}, nil, richerror.New(op).WithMessage("کلید OPENROUTER_API_KEY تنظیم نشده است")
	}

	all := make([]deepseekChatMessage, 0, len(messages)+1)
	all = append(all, deepseekChatMessage{Role: "system", Content: systemPrompt})
	all = append(all, messages...)

	reqBody := deepseekChatRequest{
		Model:          p.model(),
		Messages:       all,
		ResponseFormat: map[string]string{"type": "json_object"},
		MaxTokens:      maxTokens,
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return deepseekChatResponse{}, nil, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست OpenRouter")
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, openRouterChatCompletionsURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return deepseekChatResponse{}, nil, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست OpenRouter")
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+key)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return deepseekChatResponse{}, nil, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (OpenRouter): %v", err))
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return deepseekChatResponse{}, nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پاسخ OpenRouter")
	}

	var chatResp deepseekChatResponse
	if err := json.Unmarshal(respBytes, &chatResp); err != nil {
		return deepseekChatResponse{}, respBytes, openRouterUnparsable(op, "body", resp.StatusCode, "", string(respBytes), "", 0, err)
	}

	if resp.StatusCode != http.StatusOK {
		msg := fmt.Sprintf("%d", resp.StatusCode)
		if chatResp.Error != nil && chatResp.Error.Message != "" {
			msg = chatResp.Error.Message
		}
		return deepseekChatResponse{}, respBytes, richerror.New(op).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (OpenRouter، کد %d): %s", resp.StatusCode, msg))
	}

	if len(chatResp.Choices) == 0 {
		return deepseekChatResponse{}, respBytes, richerror.New(op).WithMessage("پاسخ مدل (OpenRouter) خالی بود")
	}
	return chatResp, respBytes, nil
}

func (p *openRouterProvider) generateScene(ctx context.Context, prompt, difficulty string) (GeneratedScene, error) {
	const op = "aiservice.openRouterProvider.generateScene"

	userText := fmt.Sprintf("Situation: %s", strings.TrimSpace(prompt))
	if difficulty != "" {
		userText += fmt.Sprintf("\nDifficulty: %s", difficulty)
	}

	chatResp, _, err := p.callWithMaxTokens(ctx, op, sceneSystemPrompt, []deepseekChatMessage{{Role: "user", Content: userText}}, sceneMaxTokens)
	if err != nil {
		return GeneratedScene{}, err
	}

	content := chatResp.usableContent()
	var scene GeneratedScene
	if err := json.Unmarshal([]byte(extractJSON(content)), &scene); err != nil {
		finish, tokens := "", 0
		if len(chatResp.Choices) > 0 {
			finish = chatResp.Choices[0].FinishReason
		}
		if chatResp.Usage != nil {
			tokens = chatResp.Usage.CompletionTokens
		}
		// لاگ با finish_reason و ابتدای پاسخ، تا دفعه‌ی بعد علت روشن باشد.
		parseErr := openRouterUnparsable(op, "scene-json", http.StatusOK, content, "", finish, tokens, err)
		if finish == "length" {
			return GeneratedScene{}, richerror.New(op).WithErr(parseErr).
				WithMessage("پاسخ مدل (OpenRouter) نیمه‌کاره ماند و به سقف توکن خروجی رسید؛ دوباره امتحان کن یا مدلی با خروجی بلندتر انتخاب کن")
		}
		return GeneratedScene{}, parseErr
	}
	if difficulty != "" {
		scene.Difficulty = difficulty
	}
	return scene, nil
}

func (p *openRouterProvider) checkGrammar(ctx context.Context, transcript string) (GrammarResult, error) {
	const op = "aiservice.openRouterProvider.checkGrammar"

	chatResp, _, err := p.call(ctx, op, grammarSystemPrompt, []deepseekChatMessage{{Role: "user", Content: transcript}})
	if err != nil {
		return GrammarResult{}, err
	}

	var result GrammarResult
	if err := json.Unmarshal([]byte(extractJSON(chatResp.usableContent())), &result); err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).WithMessage("پاسخ مدل (OpenRouter) قابل پردازش نبود")
	}
	return result, nil
}

func (p *openRouterProvider) checkRelevance(ctx context.Context, question, transcript string) (RelevanceResult, error) {
	const op = "aiservice.openRouterProvider.checkRelevance"

	userText := fmt.Sprintf("Question: %s\nTranscript: %s", strings.TrimSpace(question), strings.TrimSpace(transcript))
	chatResp, _, err := p.call(ctx, op, relevanceSystemPrompt, []deepseekChatMessage{{Role: "user", Content: userText}})
	if err != nil {
		return RelevanceResult{}, err
	}

	var result RelevanceResult
	if err := json.Unmarshal([]byte(extractJSON(chatResp.usableContent())), &result); err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).WithMessage("پاسخ مدل (OpenRouter) قابل پردازش نبود")
	}
	return result, nil
}

func (p *openRouterProvider) suggestReplies(ctx context.Context, sceneTitle, sceneDescription, sceneCategory, learnerLevel string, history []ConversationTurn) (SuggestResult, error) {
	const op = "aiservice.openRouterProvider.suggestReplies"

	chatResp, _, err := p.call(ctx, op,
		suggestSystemPrompt(sceneTitle, sceneDescription, sceneCategory, learnerLevel),
		[]deepseekChatMessage{{Role: "user", Content: formatSuggestTranscript(history)}})
	if err != nil {
		return SuggestResult{}, err
	}

	var result SuggestResult
	if err := json.Unmarshal([]byte(extractJSON(chatResp.usableContent())), &result); err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).WithMessage("پاسخ مدل (OpenRouter) قابل پردازش نبود")
	}
	if chatResp.Usage != nil {
		result.Usage = TokenUsage{InputTokens: chatResp.Usage.PromptTokens, OutputTokens: chatResp.Usage.CompletionTokens}
	}
	return result, nil
}

// converse یک بار دوباره تلاش می‌کند اگر جواب خالی/غیرقابل‌استفاده بود — همان
// الگویی که در deepseekProvider.converse جواب داد (تلاشِ دوم با یک دستورِ اضافه،
// نه تکرارِ عینِ درخواست).
func (p *openRouterProvider) converse(ctx context.Context, sceneTitle, sceneDescription, sceneCategory string, history []ConversationTurn, turnNumber, maxTurns, wrapUpFromTurn int) (ConversationResult, error) {
	result, err := p.converseOnce(ctx, sceneTitle, sceneDescription, sceneCategory, history, turnNumber, maxTurns, wrapUpFromTurn, false)
	if err != nil && errors.Is(err, errOpenRouterUnparsable) {
		slog.Warn("openrouter: retrying converse once after unusable response")
		return p.converseOnce(ctx, sceneTitle, sceneDescription, sceneCategory, history, turnNumber, maxTurns, wrapUpFromTurn, true)
	}
	return result, err
}

func (p *openRouterProvider) converseOnce(ctx context.Context, sceneTitle, sceneDescription, sceneCategory string, history []ConversationTurn, turnNumber, maxTurns, wrapUpFromTurn int, afterEmpty bool) (ConversationResult, error) {
	const op = "aiservice.openRouterProvider.converse"

	systemPrompt := fmt.Sprintf(conversationSystemPromptTemplate, sceneTitle, sceneDescription, sceneCategory, turnNumber, maxTurns, wrapUpFromTurn)
	if afterEmpty {
		systemPrompt += deepseekEmptyRetryInstruction
	}

	messages := make([]deepseekChatMessage, 0, len(history))
	for _, turn := range history {
		messages = append(messages, deepseekChatMessage{Role: turn.Role, Content: turn.Text})
	}

	chatResp, respBytes, err := p.call(ctx, op, systemPrompt, messages)
	if err != nil {
		return ConversationResult{}, err
	}

	content := chatResp.usableContent()
	var result ConversationResult
	if err := json.Unmarshal([]byte(extractJSON(content)), &result); err != nil {
		// گاهی مدل JSON نمی‌دهد و مستقیم جمله‌ی جواب را می‌نویسد؛ همان را جواب می‌گیریم
		// (به‌جای اینکه کاربر متنِ جایگزین ببیند). محتوای خالی یا نیمه‌JSON خطاست.
		if t := strings.TrimSpace(content); t != "" && !strings.Contains(t, "{") {
			result = ConversationResult{Reply: t}
		} else {
			return ConversationResult{}, openRouterUnparsable(op, "content", http.StatusOK, content, string(respBytes),
				chatResp.Choices[0].FinishReason, chatResp.completionTokens(), err)
		}
	}
	if strings.TrimSpace(result.Reply) == "" {
		return ConversationResult{}, openRouterUnparsable(op, "empty_reply", http.StatusOK, content, string(respBytes),
			chatResp.Choices[0].FinishReason, chatResp.completionTokens(), errors.New("empty reply"))
	}
	if chatResp.Usage != nil {
		result.Usage = TokenUsage{InputTokens: chatResp.Usage.PromptTokens, OutputTokens: chatResp.Usage.CompletionTokens}
	}
	return result, nil
}
