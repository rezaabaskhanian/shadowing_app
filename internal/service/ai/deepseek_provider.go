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

const deepseekChatCompletionsURL = "https://api.deepseek.com/chat/completions"

// deepseekDefaultMaxTokens بودجه‌ی توکنِ خروجی هر درخواست را صریح تعیین می‌کند
// (به‌جای تکیه بر پیش‌فرضِ خودِ API). thinking برای همه‌ی فراخوانی‌ها خاموش است
// (به deepseekThinkingDisabled نگاه کن)، پس این بودجه فقط صرفِ content واقعی
// می‌شود، نه reasoning پنهان.
const deepseekDefaultMaxTokens = 2048

// deepseekProvider تولید محتوای صحنه با کمک مدل DeepSeek را انجام می‌دهد.
// چون DeepSeek یک API سازگار با OpenAI (chat completions) دارد، بدون SDK
// جداگانه و فقط با net/http فراخوانی می‌شود. کلید و مدل مثل بقیه‌ی
// providerها در لحظه‌ی هر درخواست از settings خوانده می‌شوند.
type deepseekProvider struct {
	settings *settingsservice.Service
}

func newDeepSeekProvider(settings *settingsservice.Service) *deepseekProvider {
	return &deepseekProvider{settings: settings}
}

func (p *deepseekProvider) apiKey() string {
	return p.settings.Get(settingsservice.KeyDeepSeekAPIKey)
}

func (p *deepseekProvider) model() string {
	model := p.settings.Get(settingsservice.KeyDeepSeekModel)
	if model == "" {
		return "deepseek-chat"
	}
	return model
}

func (p *deepseekProvider) enabled() bool {
	return p.apiKey() != ""
}

type deepseekChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// deepseekThinking حالتِ «فکرکردنِ پنهان» را کنترل می‌کند. برای فراخوانی‌های
// ساختاریافته‌ی سریع (گرامر، ربط، پیشنهاد، پاسخِ گفتگو) خاموش نگه داشته می‌شود:
// روشن‌بودنش هم توکنِ content نهایی را (وقتی از max_tokens رد بشود) خالی
// می‌کند و هم تأخیر را چند برابر می‌کند تا جایی که کلاینتِ موبایل زودتر از
// جوابِ سرور context را cancel می‌کند (همان چیزی که در لاگ می‌دیدیم).
type deepseekThinking struct {
	Type string `json:"type"`
}

var deepseekThinkingDisabled = &deepseekThinking{Type: "disabled"}

type deepseekChatRequest struct {
	Model          string                `json:"model"`
	Messages       []deepseekChatMessage `json:"messages"`
	ResponseFormat map[string]string     `json:"response_format,omitempty"`
	Stream         bool                  `json:"stream"`
	MaxTokens      int                   `json:"max_tokens,omitempty"`
	Thinking       *deepseekThinking     `json:"thinking,omitempty"`
}

// deepseekResponseMessage پیامِ برگشتی. عمداً از deepseekChatMessage جداست:
// reasoning_content فقط در پاسخ می‌آید و پس‌فرستادنش در درخواست خطا می‌دهد.
type deepseekResponseMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
	// ReasoningContent گاهی حاوی کلِ جواب است در حالی که Content خالی می‌ماند
	// (رفتارِ شناخته‌شده‌ی DeepSeek: finish_reason=stop، completion_tokens>0،
	// ولی content=""). usableContent این حالت را جبران می‌کند.
	ReasoningContent string `json:"reasoning_content"`
}

type deepseekChatResponse struct {
	Choices []struct {
		Message      deepseekResponseMessage `json:"message"`
		FinishReason string                  `json:"finish_reason"`
	} `json:"choices"`
	Usage *struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (p *deepseekProvider) generateScene(ctx context.Context, prompt, difficulty string) (GeneratedScene, error) {
	const op = "aiservice.deepseekProvider.generateScene"

	key := p.apiKey()
	if key == "" {
		return GeneratedScene{}, richerror.New(op).WithMessage("کلید DEEPSEEK_API_KEY تنظیم نشده است")
	}

	userText := fmt.Sprintf("Situation: %s", strings.TrimSpace(prompt))
	if difficulty != "" {
		userText += fmt.Sprintf("\nDifficulty: %s", difficulty)
	}

	reqBody := deepseekChatRequest{
		Model: p.model(),
		Messages: []deepseekChatMessage{
			{Role: "system", Content: sceneSystemPrompt},
			{Role: "user", Content: userText},
		},
		ResponseFormat: map[string]string{"type": "json_object"},
		MaxTokens:      deepseekDefaultMaxTokens,
		Thinking:       deepseekThinkingDisabled,
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست DeepSeek")
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, deepseekChatCompletionsURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست DeepSeek")
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+key)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (DeepSeek): %v", err))
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پاسخ DeepSeek")
	}

	var chatResp deepseekChatResponse
	if err := json.Unmarshal(respBytes, &chatResp); err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).WithMessage("پاسخ مدل (DeepSeek) قابل پردازش نبود")
	}

	if resp.StatusCode != http.StatusOK {
		msg := fmt.Sprintf("%d", resp.StatusCode)
		if chatResp.Error != nil && chatResp.Error.Message != "" {
			msg = chatResp.Error.Message
		}
		return GeneratedScene{}, richerror.New(op).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (DeepSeek، کد %d): %s", resp.StatusCode, msg))
	}

	if len(chatResp.Choices) == 0 {
		return GeneratedScene{}, richerror.New(op).WithMessage("پاسخ مدل (DeepSeek) خالی بود")
	}

	jsonStr := extractJSON(chatResp.usableContent())
	var scene GeneratedScene
	if err := json.Unmarshal([]byte(jsonStr), &scene); err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (DeepSeek) قابل پردازش نبود")
	}

	if difficulty != "" {
		scene.Difficulty = difficulty
	}
	return scene, nil
}

func (p *deepseekProvider) checkGrammar(ctx context.Context, transcript string) (GrammarResult, error) {
	const op = "aiservice.deepseekProvider.checkGrammar"

	key := p.apiKey()
	if key == "" {
		return GrammarResult{}, richerror.New(op).WithMessage("کلید DEEPSEEK_API_KEY تنظیم نشده است")
	}

	reqBody := deepseekChatRequest{
		Model: p.model(),
		Messages: []deepseekChatMessage{
			{Role: "system", Content: grammarSystemPrompt},
			{Role: "user", Content: transcript},
		},
		ResponseFormat: map[string]string{"type": "json_object"},
		MaxTokens:      deepseekDefaultMaxTokens,
		Thinking:       deepseekThinkingDisabled,
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست DeepSeek")
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, deepseekChatCompletionsURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست DeepSeek")
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+key)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (DeepSeek): %v", err))
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پاسخ DeepSeek")
	}

	var chatResp deepseekChatResponse
	if err := json.Unmarshal(respBytes, &chatResp); err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).WithMessage("پاسخ مدل (DeepSeek) قابل پردازش نبود")
	}

	if resp.StatusCode != http.StatusOK {
		msg := fmt.Sprintf("%d", resp.StatusCode)
		if chatResp.Error != nil && chatResp.Error.Message != "" {
			msg = chatResp.Error.Message
		}
		return GrammarResult{}, richerror.New(op).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (DeepSeek، کد %d): %s", resp.StatusCode, msg))
	}

	if len(chatResp.Choices) == 0 {
		return GrammarResult{}, richerror.New(op).WithMessage("پاسخ مدل (DeepSeek) خالی بود")
	}

	jsonStr := extractJSON(chatResp.usableContent())
	var result GrammarResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (DeepSeek) قابل پردازش نبود")
	}
	return result, nil
}

// errDeepseekUnparsable خطای «جواب قابل‌استفاده نبود» (محتوای خالی/غیرJSON) را
// علامت می‌زند تا converse فقط برای همین حالت دوباره تلاش کند، نه برای هر خطایی.
var errDeepseekUnparsable = errors.New("deepseek: unparsable response")

func (r deepseekChatResponse) completionTokens() int {
	if r.Usage == nil {
		return 0
	}
	return r.Usage.CompletionTokens
}

// usableContent محتوای قابل‌استفاده‌ی اولین choice را می‌دهد. وقتی content خالی
// است ولی مدل توکن تولید کرده، جواب معمولاً در reasoning_content نشسته؛ به‌جای
// دورانداختنِ یک جوابِ سالم و نشان‌دادنِ متنِ جایگزین به کاربر، همان را برمی‌گرداند.
func (r deepseekChatResponse) usableContent() string {
	if len(r.Choices) == 0 {
		return ""
	}
	if c := strings.TrimSpace(r.Choices[0].Message.Content); c != "" {
		return r.Choices[0].Message.Content
	}
	return r.Choices[0].Message.ReasoningContent
}

// deepseekFailure دادهٔ تشخیصیِ یک پاسخِ غیرقابل‌استفاده. body بدنه‌ی خامِ HTTP
// است: وقتی content و reasoning_content هر دو خالی‌اند ولی completionTokens>0،
// تنها چیزی که نشان می‌دهد مدل خروجی را کجا گذاشته، همین بدنه‌ی خام است.
type deepseekFailure struct {
	op               richerror.Op
	stage            string
	status           int
	content          string
	body             string
	finishReason     string
	completionTokens int
	cause            error
}

func deepseekSnippet(s string, max int) string {
	s = strings.TrimSpace(s)
	if len(s) > max {
		return s[:max]
	}
	return s
}

// deepseekUnparsable خطای قابل‌تشخیص می‌سازد و جزئیاتِ پاسخ را لاگ می‌کند؛
// قبلاً فقط «قابل پردازش نبود» می‌آمد و معلوم نبود DeepSeek چه برگردانده.
func deepseekUnparsable(f deepseekFailure) error {
	slog.Warn("deepseek: unparsable response",
		"op", string(f.op), "stage", f.stage, "status", f.status,
		"raw", deepseekSnippet(f.content, 300),
		"body", deepseekSnippet(f.body, 1200),
		"finish_reason", f.finishReason, "completion_tokens", f.completionTokens, "cause", f.cause)
	return richerror.New(f.op).
		WithErr(fmt.Errorf("%w (%s): %v", errDeepseekUnparsable, f.stage, f.cause)).
		WithMessage("پاسخ مدل (DeepSeek) قابل پردازش نبود")
}

// deepseekEmptyRetryInstruction به تلاشِ دومِ converse اضافه می‌شود. تکرارِ عینِ
// همان درخواست بی‌فایده بود (در لاگ، هر دو تلاش دقیقاً یک‌جور خالی برمی‌گشتند)،
// چون «محتوای خالی» در JSON modeِ DeepSeek رفتاری است که خودشان پذیرفته‌اند و
// با همان ورودی تکرار می‌شود؛ پس تلاش دوم باید ورودیِ متفاوتی داشته باشد.
const deepseekEmptyRetryInstruction = "\n\nIMPORTANT: your previous response had an empty content field. You MUST return a single non-empty JSON object matching the schema above. Never return an empty string."

// converse یک بار دوباره تلاش می‌کند اگر جواب DeepSeek خالی/غیرقابل‌استفاده بود.
// خطاهای دیگر (شبکه، کلید، سهمیه) دوباره تلاش نمی‌شوند.
func (p *deepseekProvider) converse(ctx context.Context, sceneTitle, sceneDescription, sceneCategory string, history []ConversationTurn, turnNumber, maxTurns, wrapUpFromTurn int) (ConversationResult, error) {
	result, err := p.converseOnce(ctx, sceneTitle, sceneDescription, sceneCategory, history, turnNumber, maxTurns, wrapUpFromTurn, false)
	if err != nil && errors.Is(err, errDeepseekUnparsable) {
		slog.Warn("deepseek: retrying converse once after unusable response")
		return p.converseOnce(ctx, sceneTitle, sceneDescription, sceneCategory, history, turnNumber, maxTurns, wrapUpFromTurn, true)
	}
	return result, err
}

func (p *deepseekProvider) converseOnce(ctx context.Context, sceneTitle, sceneDescription, sceneCategory string, history []ConversationTurn, turnNumber, maxTurns, wrapUpFromTurn int, afterEmpty bool) (ConversationResult, error) {
	const op = "aiservice.deepseekProvider.converse"

	key := p.apiKey()
	if key == "" {
		return ConversationResult{}, richerror.New(op).WithMessage("کلید DEEPSEEK_API_KEY تنظیم نشده است")
	}

	systemPrompt := fmt.Sprintf(conversationSystemPromptTemplate, sceneTitle, sceneDescription, sceneCategory, turnNumber, maxTurns, wrapUpFromTurn)
	if afterEmpty {
		systemPrompt += deepseekEmptyRetryInstruction
	}

	messages := make([]deepseekChatMessage, 0, len(history)+1)
	messages = append(messages, deepseekChatMessage{Role: "system", Content: systemPrompt})
	for _, turn := range history {
		messages = append(messages, deepseekChatMessage{Role: turn.Role, Content: turn.Text})
	}

	reqBody := deepseekChatRequest{
		Model:          p.model(),
		Messages:       messages,
		ResponseFormat: map[string]string{"type": "json_object"},
		MaxTokens:      deepseekDefaultMaxTokens,
		Thinking:       deepseekThinkingDisabled,
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return ConversationResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست DeepSeek")
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, deepseekChatCompletionsURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return ConversationResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست DeepSeek")
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+key)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return ConversationResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (DeepSeek): %v", err))
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return ConversationResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پاسخ DeepSeek")
	}

	var chatResp deepseekChatResponse
	if err := json.Unmarshal(respBytes, &chatResp); err != nil {
		return ConversationResult{}, deepseekUnparsable(deepseekFailure{
			op: op, stage: "body", status: resp.StatusCode, body: string(respBytes), cause: err,
		})
	}

	if resp.StatusCode != http.StatusOK {
		msg := fmt.Sprintf("%d", resp.StatusCode)
		if chatResp.Error != nil && chatResp.Error.Message != "" {
			msg = chatResp.Error.Message
		}
		return ConversationResult{}, richerror.New(op).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (DeepSeek، کد %d): %s", resp.StatusCode, msg))
	}

	if len(chatResp.Choices) == 0 {
		return ConversationResult{}, richerror.New(op).WithMessage("پاسخ مدل (DeepSeek) خالی بود")
	}

	content := chatResp.usableContent()
	var result ConversationResult
	if err := json.Unmarshal([]byte(extractJSON(content)), &result); err != nil {
		// گاهی مدل JSON نمی‌دهد و مستقیم جمله‌ی جواب را می‌نویسد؛ همان را جواب می‌گیریم
		// (به‌جای اینکه کاربر متنِ جایگزین ببیند). محتوای خالی یا نیمه‌JSON خطاست.
		if t := strings.TrimSpace(content); t != "" && !strings.Contains(t, "{") {
			result = ConversationResult{Reply: t}
		} else {
			return ConversationResult{}, deepseekUnparsable(deepseekFailure{
				op: op, stage: "content", status: resp.StatusCode, content: content, body: string(respBytes),
				finishReason: chatResp.Choices[0].FinishReason, completionTokens: chatResp.completionTokens(), cause: err,
			})
		}
	}
	if strings.TrimSpace(result.Reply) == "" {
		return ConversationResult{}, deepseekUnparsable(deepseekFailure{
			op: op, stage: "empty_reply", status: resp.StatusCode, content: content, body: string(respBytes),
			finishReason: chatResp.Choices[0].FinishReason, completionTokens: chatResp.completionTokens(), cause: errors.New("empty reply"),
		})
	}
	if chatResp.Usage != nil {
		result.Usage = TokenUsage{
			InputTokens:  chatResp.Usage.PromptTokens,
			OutputTokens: chatResp.Usage.CompletionTokens,
		}
	}
	return result, nil
}

func (p *deepseekProvider) suggestReplies(ctx context.Context, sceneTitle, sceneDescription, sceneCategory, learnerLevel string, history []ConversationTurn) (SuggestResult, error) {
	const op = "aiservice.deepseekProvider.suggestReplies"

	key := p.apiKey()
	if key == "" {
		return SuggestResult{}, richerror.New(op).WithMessage("کلید DEEPSEEK_API_KEY تنظیم نشده است")
	}

	reqBody := deepseekChatRequest{
		Model: p.model(),
		Messages: []deepseekChatMessage{
			{Role: "system", Content: suggestSystemPrompt(sceneTitle, sceneDescription, sceneCategory, learnerLevel)},
			{Role: "user", Content: formatSuggestTranscript(history)},
		},
		ResponseFormat: map[string]string{"type": "json_object"},
		MaxTokens:      deepseekDefaultMaxTokens,
		Thinking:       deepseekThinkingDisabled,
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست DeepSeek")
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, deepseekChatCompletionsURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست DeepSeek")
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+key)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (DeepSeek): %v", err))
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پاسخ DeepSeek")
	}

	var chatResp deepseekChatResponse
	if err := json.Unmarshal(respBytes, &chatResp); err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).WithMessage("پاسخ مدل (DeepSeek) قابل پردازش نبود")
	}

	if resp.StatusCode != http.StatusOK {
		msg := fmt.Sprintf("%d", resp.StatusCode)
		if chatResp.Error != nil && chatResp.Error.Message != "" {
			msg = chatResp.Error.Message
		}
		return SuggestResult{}, richerror.New(op).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (DeepSeek، کد %d): %s", resp.StatusCode, msg))
	}

	if len(chatResp.Choices) == 0 {
		return SuggestResult{}, richerror.New(op).WithMessage("پاسخ مدل (DeepSeek) خالی بود")
	}

	jsonStr := extractJSON(chatResp.usableContent())
	var result SuggestResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (DeepSeek) قابل پردازش نبود")
	}
	if chatResp.Usage != nil {
		result.Usage = TokenUsage{
			InputTokens:  chatResp.Usage.PromptTokens,
			OutputTokens: chatResp.Usage.CompletionTokens,
		}
	}
	return result, nil
}

func (p *deepseekProvider) checkRelevance(ctx context.Context, question, transcript string) (RelevanceResult, error) {
	const op = "aiservice.deepseekProvider.checkRelevance"

	key := p.apiKey()
	if key == "" {
		return RelevanceResult{}, richerror.New(op).WithMessage("کلید DEEPSEEK_API_KEY تنظیم نشده است")
	}

	userText := fmt.Sprintf("Question: %s\nTranscript: %s", strings.TrimSpace(question), strings.TrimSpace(transcript))

	reqBody := deepseekChatRequest{
		Model: p.model(),
		Messages: []deepseekChatMessage{
			{Role: "system", Content: relevanceSystemPrompt},
			{Role: "user", Content: userText},
		},
		ResponseFormat: map[string]string{"type": "json_object"},
		MaxTokens:      deepseekDefaultMaxTokens,
		Thinking:       deepseekThinkingDisabled,
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست DeepSeek")
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, deepseekChatCompletionsURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست DeepSeek")
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+key)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (DeepSeek): %v", err))
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پاسخ DeepSeek")
	}

	var chatResp deepseekChatResponse
	if err := json.Unmarshal(respBytes, &chatResp); err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).WithMessage("پاسخ مدل (DeepSeek) قابل پردازش نبود")
	}

	if resp.StatusCode != http.StatusOK {
		msg := fmt.Sprintf("%d", resp.StatusCode)
		if chatResp.Error != nil && chatResp.Error.Message != "" {
			msg = chatResp.Error.Message
		}
		return RelevanceResult{}, richerror.New(op).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (DeepSeek، کد %d): %s", resp.StatusCode, msg))
	}

	if len(chatResp.Choices) == 0 {
		return RelevanceResult{}, richerror.New(op).WithMessage("پاسخ مدل (DeepSeek) خالی بود")
	}

	jsonStr := extractJSON(chatResp.usableContent())
	var result RelevanceResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (DeepSeek) قابل پردازش نبود")
	}
	return result, nil
}
