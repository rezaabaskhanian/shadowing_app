package adminhandler

import (
	"net/http"
	"strings"

	settingsservice "shadowing-backend/internal/service/settings"

	"github.com/labstack/echo/v4"
)

// maskSecret فقط ۴ کاراکتر اول و آخر یک مقدار حساس (کلید API) را نشان می‌دهد.
func maskSecret(v string) string {
	if v == "" {
		return ""
	}
	if len(v) <= 8 {
		return strings.Repeat("*", len(v))
	}
	return v[:4] + strings.Repeat("*", 6) + v[len(v)-4:]
}

type settingItem struct {
	Set    bool   `json:"set"`
	Masked string `json:"masked"`
}

type settingsResponse struct {
	AIProvider    string      `json:"ai_provider"`
	Anthropic     settingItem `json:"anthropic_api_key"`
	ClaudeModel   string      `json:"claude_model"`
	Gemini        settingItem `json:"gemini_api_key"`
	GeminiModel   string      `json:"gemini_model"`
	DeepSeek      settingItem `json:"deepseek_api_key"`
	DeepSeekModel string      `json:"deepseek_model"`
	ElevenLabs    settingItem `json:"elevenlabs_api_key"`
	VoiceID       settingItem `json:"elevenlabs_voice_id"`
	FCMKey        settingItem `json:"fcm_service_account_json"`
}

// GetSettings وضعیت فعلی تنظیمات را برمی‌گرداند؛ خودِ کلیدها هیچ‌وقت کامل نمایش
// داده نمی‌شوند، فقط ماسک‌شده (مثلاً برای تشخیص «آیا ست شده یا نه»).
func (h Handler) GetSettings(c echo.Context) error {
	s := h.settingsSvc
	get := func(key string) settingItem {
		v := s.Get(key)
		return settingItem{Set: v != "", Masked: maskSecret(v)}
	}

	provider := s.Get(settingsservice.KeyAIProvider)
	if provider == "" {
		provider = "anthropic"
	}

	return c.JSON(http.StatusOK, settingsResponse{
		AIProvider:    provider,
		Anthropic:     get(settingsservice.KeyAnthropicAPIKey),
		ClaudeModel:   s.Get(settingsservice.KeyClaudeModel),
		Gemini:        get(settingsservice.KeyGeminiAPIKey),
		GeminiModel:   s.Get(settingsservice.KeyGeminiModel),
		DeepSeek:      get(settingsservice.KeyDeepSeekAPIKey),
		DeepSeekModel: s.Get(settingsservice.KeyDeepSeekModel),
		ElevenLabs:    get(settingsservice.KeyElevenLabsAPIKey),
		VoiceID:       get(settingsservice.KeyElevenLabsVoiceID),
		FCMKey:        get(settingsservice.KeyFCMServiceAccount),
	})
}

type updateSettingRequest struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// UpdateSetting یک کلید تنظیمات (مثلاً یک کلید API) را ذخیره می‌کند. بلافاصله
// در همان لحظه فعال می‌شود، بدون نیاز به ری‌استارت سرور.
func (h Handler) UpdateSetting(c echo.Context) error {
	var req updateSettingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if !settingsservice.AllowedKeys[req.Key] {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "کلید تنظیمات نامعتبر است"})
	}

	if err := h.settingsSvc.Set(c.Request().Context(), req.Key, strings.TrimSpace(req.Value)); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در ذخیره تنظیمات"})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "ذخیره شد"})
}
