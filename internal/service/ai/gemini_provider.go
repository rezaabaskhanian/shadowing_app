package aiservice

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"sync"

	"shadowing-backend/internal/pkg/outboundhttp"
	"shadowing-backend/internal/pkg/richerror"
	settingsservice "shadowing-backend/internal/service/settings"

	"google.golang.org/genai"
)

// geminiProvider تولید محتوای صحنه با کمک مدل Gemini را انجام می‌دهد.
// کلید API و مدل در لحظه‌ی هر درخواست از settings خوانده می‌شوند تا تغییر کلید
// از پنل ادمین بدون ری‌استارت سرور اعمال شود؛ کلاینت فقط وقتی کلید عوض شده بازسازی می‌شود.
type geminiProvider struct {
	settings *settingsservice.Service

	mu          sync.Mutex
	cachedKey   string
	initialized bool
	client      *genai.Client
}

func newGeminiProvider(settings *settingsservice.Service) *geminiProvider {
	return &geminiProvider{settings: settings}
}

func (p *geminiProvider) apiKey() string {
	return p.settings.Get(settingsservice.KeyGeminiAPIKey)
}

func (p *geminiProvider) model() string {
	model := p.settings.Get(settingsservice.KeyGeminiModel)
	if model == "" {
		return "gemini-flash-latest"
	}
	return model
}

func (p *geminiProvider) enabled() bool {
	return p.apiKey() != ""
}

func (p *geminiProvider) clientFor(ctx context.Context, key string) (*genai.Client, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.initialized && key == p.cachedKey {
		return p.client, nil
	}
	httpClient, err := outboundhttp.Client()
	if err != nil {
		return nil, err
	}

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:     key,
		Backend:    genai.BackendGeminiAPI,
		HTTPClient: httpClient,
	})
	if err != nil {
		return nil, err
	}
	p.client = client
	p.cachedKey = key
	p.initialized = true
	return p.client, nil
}

func (p *geminiProvider) generateScene(ctx context.Context, prompt, difficulty string) (GeneratedScene, error) {
	const op = "aiservice.geminiProvider.generateScene"

	key := p.apiKey()
	if key == "" {
		return GeneratedScene{}, richerror.New(op).WithMessage("کلید GEMINI_API_KEY تنظیم نشده است")
	}

	client, err := p.clientFor(ctx, key)
	if err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در ساخت کلاینت Gemini: %v", err))
	}

	userText := fmt.Sprintf("Situation: %s", strings.TrimSpace(prompt))
	if difficulty != "" {
		userText += fmt.Sprintf("\nDifficulty: %s", difficulty)
	}

	resp, err := client.Models.GenerateContent(
		ctx,
		p.model(),
		genai.Text(userText),
		&genai.GenerateContentConfig{
			SystemInstruction: genai.NewContentFromText(sceneSystemPrompt, genai.RoleUser),
			ResponseMIMEType:  "application/json",
		},
	)
	if err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Gemini): %v", err))
	}

	jsonStr := extractJSON(resp.Text())
	var scene GeneratedScene
	if err := json.Unmarshal([]byte(jsonStr), &scene); err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (Gemini) قابل پردازش نبود")
	}

	if difficulty != "" {
		scene.Difficulty = difficulty
	}
	return scene, nil
}

// generateFast یک فراخوانیِ JSONِ کوتاه (گرامر، ربط، پیشنهاد، پاسخِ گفتگو) را
// بدونِ «thinking» اجرا می‌کند: مدل‌های flash به‌طور پیش‌فرض قبل از جواب چند
// ثانیه فکر می‌کنند که برای این کارهای ساده فقط تأخیر است. اگر مدلِ انتخاب‌شده
// خاموش‌کردنِ thinking را نپذیرد (خطایی که به thinking اشاره کند)، یک بار بدون آن
// تنظیم دوباره تلاش می‌کند، تا هیچ قابلیتی به‌خاطرِ این بهینه‌سازی نشکند.
// defaultGeminiFallbackModel مدلِ جایگزین وقتی مدلِ اصلی شلوغ است (۵۰۳/۴۲۹). مدلِ
// سبک‌تر ظرفیتِ جدایی دارد و معمولاً وقتی flash اصلی «high demand» می‌دهد جواب می‌دهد.
// از پنل ادمین (GEMINI_FALLBACK_MODEL) قابل تغییر است.
const defaultGeminiFallbackModel = "gemini-2.5-flash-lite"

func (p *geminiProvider) fallbackModel() string {
	if m := strings.TrimSpace(p.settings.Get(settingsservice.KeyGeminiFallbackModel)); m != "" {
		return m
	}
	return defaultGeminiFallbackModel
}

// isTransientGeminiError خطاهایی را تشخیص می‌دهد که با یک مدل/دفعه‌ی دیگر ممکن است
// درست شوند: شلوغیِ مدل (۵۰۳)، محدودیتِ نرخ (۴۲۹) و خطاهای سمتِ سرور. خطای کلید،
// اسمِ مدل یا درخواست (۴۰۰/۴۰۳/۴۰۴) گذرا نیستند و دوباره تلاش نمی‌شوند.
func isTransientGeminiError(err error) bool {
	var ae genai.APIError
	if errors.As(err, &ae) {
		return ae.Code == 429 || ae.Code >= 500
	}
	var pe *genai.APIError
	if errors.As(err, &pe) && pe != nil {
		return pe.Code == 429 || pe.Code >= 500
	}
	return false
}

// generateFast یک فراخوانیِ JSONِ کوتاه (گرامر، ربط، پیشنهاد، پاسخِ گفتگو) را
// بدونِ «thinking» اجرا می‌کند (تأخیرِ بی‌فایده برای کارهای ساده). اگر مدلِ اصلی
// شلوغ بود (۵۰۳/۴۲۹)، فوراً یک بار با مدلِ جایگزین (GEMINI_FALLBACK_MODEL) تلاش
// می‌کند تا کاربر «Sorry, I didn't catch that» نبیند؛ اگر آن هم شکست خورد، خطای
// مدلِ اصلی برمی‌گردد (آموزنده‌تر است).
func (p *geminiProvider) generateFast(ctx context.Context, client *genai.Client, contents []*genai.Content, systemPrompt string) (*genai.GenerateContentResponse, error) {
	primary := p.model()
	resp, err := p.generateFastModel(ctx, client, primary, contents, systemPrompt)
	if err == nil || !isTransientGeminiError(err) {
		return resp, err
	}

	fallback := p.fallbackModel()
	if fallback == "" || fallback == primary {
		return resp, err
	}
	slog.Warn("gemini: primary model unavailable, trying fallback model", "primary", primary, "fallback", fallback, "err", err)
	resp2, err2 := p.generateFastModel(ctx, client, fallback, contents, systemPrompt)
	if err2 != nil {
		slog.Warn("gemini: fallback model failed too", "fallback", fallback, "err", err2)
		return nil, err
	}
	return resp2, nil
}

// generateFastModel یک فراخوانیِ JSON با مدلِ مشخص؛ thinking را خاموش می‌کند و اگر مدل
// خاموش‌کردنش را نپذیرد (خطایی که به thinking اشاره کند)، یک بار بدون آن تلاش می‌کند.
func (p *geminiProvider) generateFastModel(ctx context.Context, client *genai.Client, model string, contents []*genai.Content, systemPrompt string) (*genai.GenerateContentResponse, error) {
	cfg := &genai.GenerateContentConfig{
		SystemInstruction: genai.NewContentFromText(systemPrompt, genai.RoleUser),
		ResponseMIMEType:  "application/json",
		ThinkingConfig:    &genai.ThinkingConfig{ThinkingBudget: genai.Ptr[int32](0)},
	}
	resp, err := client.Models.GenerateContent(ctx, model, contents, cfg)
	if err != nil && strings.Contains(strings.ToLower(err.Error()), "thinking") {
		cfg.ThinkingConfig = nil
		return client.Models.GenerateContent(ctx, model, contents, cfg)
	}
	return resp, err
}

func (p *geminiProvider) checkGrammar(ctx context.Context, transcript string) (GrammarResult, error) {
	const op = "aiservice.geminiProvider.checkGrammar"

	key := p.apiKey()
	if key == "" {
		return GrammarResult{}, richerror.New(op).WithMessage("کلید GEMINI_API_KEY تنظیم نشده است")
	}

	client, err := p.clientFor(ctx, key)
	if err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در ساخت کلاینت Gemini: %v", err))
	}

	resp, err := p.generateFast(ctx, client, genai.Text(transcript), grammarSystemPrompt)
	if err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Gemini): %v", err))
	}

	jsonStr := extractJSON(resp.Text())
	var result GrammarResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (Gemini) قابل پردازش نبود")
	}
	return result, nil
}

func (p *geminiProvider) converse(ctx context.Context, sceneTitle, sceneDescription, sceneCategory string, history []ConversationTurn, turnNumber, maxTurns, wrapUpFromTurn int) (ConversationResult, error) {
	const op = "aiservice.geminiProvider.converse"

	key := p.apiKey()
	if key == "" {
		return ConversationResult{}, richerror.New(op).WithMessage("کلید GEMINI_API_KEY تنظیم نشده است")
	}

	client, err := p.clientFor(ctx, key)
	if err != nil {
		return ConversationResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در ساخت کلاینت Gemini: %v", err))
	}

	systemPrompt := fmt.Sprintf(conversationSystemPromptTemplate, sceneTitle, sceneDescription, sceneCategory, turnNumber, maxTurns, wrapUpFromTurn)

	contents := make([]*genai.Content, 0, len(history)+1)
	for _, turn := range history {
		var role genai.Role = genai.RoleUser
		if turn.Role == "assistant" {
			role = genai.RoleModel
		}
		contents = append(contents, genai.NewContentFromText(turn.Text, role))
	}
	if len(contents) == 0 {
		contents = append(contents, genai.NewContentFromText("(Begin the conversation in character.)", genai.RoleUser))
	}

	resp, err := p.generateFast(ctx, client, contents, systemPrompt)
	if err != nil {
		return ConversationResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Gemini): %v", err))
	}

	jsonStr := extractJSON(resp.Text())
	var result ConversationResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return ConversationResult{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (Gemini) قابل پردازش نبود")
	}
	if resp.UsageMetadata != nil {
		result.Usage = TokenUsage{
			InputTokens:  int(resp.UsageMetadata.PromptTokenCount),
			OutputTokens: int(resp.UsageMetadata.CandidatesTokenCount),
		}
	}
	return result, nil
}

func (p *geminiProvider) suggestReplies(ctx context.Context, sceneTitle, sceneDescription, sceneCategory, learnerLevel string, history []ConversationTurn) (SuggestResult, error) {
	const op = "aiservice.geminiProvider.suggestReplies"

	key := p.apiKey()
	if key == "" {
		return SuggestResult{}, richerror.New(op).WithMessage("کلید GEMINI_API_KEY تنظیم نشده است")
	}

	client, err := p.clientFor(ctx, key)
	if err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در ساخت کلاینت Gemini: %v", err))
	}

	resp, err := p.generateFast(ctx, client, genai.Text(formatSuggestTranscript(history)), suggestSystemPrompt(sceneTitle, sceneDescription, sceneCategory, learnerLevel))
	if err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Gemini): %v", err))
	}

	jsonStr := extractJSON(resp.Text())
	var result SuggestResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (Gemini) قابل پردازش نبود")
	}
	if resp.UsageMetadata != nil {
		result.Usage = TokenUsage{
			InputTokens:  int(resp.UsageMetadata.PromptTokenCount),
			OutputTokens: int(resp.UsageMetadata.CandidatesTokenCount),
		}
	}
	return result, nil
}

func (p *geminiProvider) checkRelevance(ctx context.Context, question, transcript string) (RelevanceResult, error) {
	const op = "aiservice.geminiProvider.checkRelevance"

	key := p.apiKey()
	if key == "" {
		return RelevanceResult{}, richerror.New(op).WithMessage("کلید GEMINI_API_KEY تنظیم نشده است")
	}

	client, err := p.clientFor(ctx, key)
	if err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در ساخت کلاینت Gemini: %v", err))
	}

	userText := fmt.Sprintf("Question: %s\nTranscript: %s", strings.TrimSpace(question), strings.TrimSpace(transcript))

	resp, err := p.generateFast(ctx, client, genai.Text(userText), relevanceSystemPrompt)
	if err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Gemini): %v", err))
	}

	jsonStr := extractJSON(resp.Text())
	var result RelevanceResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (Gemini) قابل پردازش نبود")
	}
	return result, nil
}
