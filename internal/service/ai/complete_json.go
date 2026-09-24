package aiservice

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/anthropics/anthropic-sdk-go"
	"google.golang.org/genai"
)

// completeJSON یک فراخوانیِ عمومیِ «system prompt + متن کاربر → یک شیء JSON»
// است. فیچرهای جدید (مثل افعال چندمعنایی) به‌جای افزودن یک متد جدا به هر
// چهار provider، از همین استفاده می‌کنند؛ خروجی از قبل با extractJSON تمیز شده.
type jsonCompleter interface {
	completeJSON(ctx context.Context, op richerror.Op, systemPrompt, userText string) (string, TokenUsage, error)
}

func (s Service) completeJSON(ctx context.Context, op richerror.Op, systemPrompt, userText string, out any) (TokenUsage, error) {
	c, ok := s.activeProvider().(jsonCompleter)
	if !ok {
		return TokenUsage{}, richerror.New(op).WithMessage("ارائه‌دهنده‌ی فعال هوش مصنوعی از این قابلیت پشتیبانی نمی‌کند")
	}

	var raw string
	var usage TokenUsage
	err := withLimit(ctx, func() error {
		var err error
		raw, usage, err = c.completeJSON(ctx, op, systemPrompt, userText)
		return err
	})
	if err != nil {
		return usage, err
	}
	if err := json.Unmarshal([]byte(raw), out); err != nil {
		return usage, richerror.New(op).WithErr(err).WithMessage("پاسخ مدل هوش مصنوعی قابل پردازش نبود")
	}
	return usage, nil
}

func (p *geminiProvider) completeJSON(ctx context.Context, op richerror.Op, systemPrompt, userText string) (string, TokenUsage, error) {
	key := p.apiKey()
	if key == "" {
		return "", TokenUsage{}, richerror.New(op).WithMessage("کلید GEMINI_API_KEY تنظیم نشده است")
	}
	client, err := p.clientFor(ctx, key)
	if err != nil {
		return "", TokenUsage{}, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در ساخت کلاینت Gemini: %v", err))
	}
	resp, err := p.generateFast(ctx, client, genai.Text(userText), systemPrompt)
	if err != nil {
		return "", TokenUsage{}, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Gemini): %v", err))
	}
	var usage TokenUsage
	if resp.UsageMetadata != nil {
		usage = TokenUsage{InputTokens: int(resp.UsageMetadata.PromptTokenCount), OutputTokens: int(resp.UsageMetadata.CandidatesTokenCount)}
	}
	return extractJSON(resp.Text()), usage, nil
}

func (p *anthropicProvider) completeJSON(ctx context.Context, op richerror.Op, systemPrompt, userText string) (string, TokenUsage, error) {
	key := p.apiKey()
	if key == "" {
		return "", TokenUsage{}, richerror.New(op).WithMessage("کلید ANTHROPIC_API_KEY تنظیم نشده است")
	}
	client, err := p.clientFor(key)
	if err != nil {
		return "", TokenUsage{}, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در تنظیم پراکسی خروجی: %v", err))
	}
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     p.model(),
		MaxTokens: 4096,
		System:    []anthropic.TextBlockParam{{Text: systemPrompt}},
		Messages:  []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(userText))},
	})
	if err != nil {
		return "", TokenUsage{}, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Claude): %v", err))
	}
	var raw strings.Builder
	for _, block := range resp.Content {
		if b, ok := block.AsAny().(anthropic.TextBlock); ok {
			raw.WriteString(b.Text)
		}
	}
	usage := TokenUsage{InputTokens: int(resp.Usage.InputTokens), OutputTokens: int(resp.Usage.OutputTokens)}
	return extractJSON(raw.String()), usage, nil
}

func (p *openRouterProvider) completeJSON(ctx context.Context, op richerror.Op, systemPrompt, userText string) (string, TokenUsage, error) {
	chatResp, _, err := p.call(ctx, op, systemPrompt, []deepseekChatMessage{{Role: "user", Content: userText}})
	if err != nil {
		return "", TokenUsage{}, err
	}
	var usage TokenUsage
	if chatResp.Usage != nil {
		usage = TokenUsage{InputTokens: chatResp.Usage.PromptTokens, OutputTokens: chatResp.Usage.CompletionTokens}
	}
	return extractJSON(chatResp.usableContent()), usage, nil
}

func (p *deepseekProvider) completeJSON(ctx context.Context, op richerror.Op, systemPrompt, userText string) (string, TokenUsage, error) {
	key := p.apiKey()
	if key == "" {
		return "", TokenUsage{}, richerror.New(op).WithMessage("کلید DEEPSEEK_API_KEY تنظیم نشده است")
	}
	bodyBytes, err := json.Marshal(deepseekChatRequest{
		Model: p.model(),
		Messages: []deepseekChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userText},
		},
		ResponseFormat: map[string]string{"type": "json_object"},
		MaxTokens:      deepseekDefaultMaxTokens,
		Thinking:       deepseekThinkingDisabled,
	})
	if err != nil {
		return "", TokenUsage{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست DeepSeek")
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, deepseekChatCompletionsURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", TokenUsage{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست DeepSeek")
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+key)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return "", TokenUsage{}, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (DeepSeek): %v", err))
	}
	defer resp.Body.Close()
	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", TokenUsage{}, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پاسخ DeepSeek")
	}
	var chatResp deepseekChatResponse
	if err := json.Unmarshal(respBytes, &chatResp); err != nil {
		return "", TokenUsage{}, richerror.New(op).WithErr(err).WithMessage("پاسخ مدل (DeepSeek) قابل پردازش نبود")
	}
	if resp.StatusCode != http.StatusOK {
		msg := fmt.Sprintf("%d", resp.StatusCode)
		if chatResp.Error != nil && chatResp.Error.Message != "" {
			msg = chatResp.Error.Message
		}
		return "", TokenUsage{}, richerror.New(op).WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (DeepSeek، کد %d): %s", resp.StatusCode, msg))
	}
	if len(chatResp.Choices) == 0 {
		return "", TokenUsage{}, richerror.New(op).WithMessage("پاسخ مدل (DeepSeek) خالی بود")
	}
	var usage TokenUsage
	if chatResp.Usage != nil {
		usage = TokenUsage{InputTokens: chatResp.Usage.PromptTokens, OutputTokens: chatResp.Usage.CompletionTokens}
	}
	return extractJSON(chatResp.usableContent()), usage, nil
}
