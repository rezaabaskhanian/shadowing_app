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
	settingsservice "shadowing-backend/internal/service/settings"
)

const deepseekChatCompletionsURL = "https://api.deepseek.com/chat/completions"

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

type deepseekChatRequest struct {
	Model          string                `json:"model"`
	Messages       []deepseekChatMessage `json:"messages"`
	ResponseFormat map[string]string     `json:"response_format,omitempty"`
	Stream         bool                  `json:"stream"`
}

type deepseekChatResponse struct {
	Choices []struct {
		Message deepseekChatMessage `json:"message"`
	} `json:"choices"`
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

	jsonStr := extractJSON(chatResp.Choices[0].Message.Content)
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
