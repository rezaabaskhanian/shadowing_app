package realtimepochandler

import (
	"net/http"
	"os"
	"time"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/outboundhttp"
	settingsservice "shadowing-backend/internal/service/settings"

	"github.com/labstack/echo/v4"
	"google.golang.org/genai"
)

// defaultTokenTTL - طول عمر پیش‌فرض توکن. عمداً کوتاه نگه داشته شده (نه ۳۰
// دقیقه‌ی پیش‌فرض SDK) چون هدف همین PoC اثبات این است که ExpireTime واقعاً
// سمت Gemini، صرف‌نظر از رفتار کلاینت، session را قطع می‌کند.
const defaultTokenTTL = 5 * time.Minute

// liveModel - مدلی که کلاینت (اپ) باید برای اتصال به Live API استفاده کند.
// عمداً هاردکد نیست تا بدون deploy جدید قابل تغییر باشد؛ چون این فقط PoC است،
// در تنظیمات پنل ادمین اضافه نشده و به یک env ساده بسنده شده.
func liveModel() string {
	if m := os.Getenv("GEMINI_LIVE_MODEL"); m != "" {
		return m
	}
	return "gemini-2.5-flash-native-audio-preview-09-2025"
}

type tokenResponse struct {
	Token    string    `json:"token"`
	Model    string    `json:"model"`
	ExpireAt time.Time `json:"expire_at"`
}

// IssueToken - یک ephemeral token کوتاه‌عمر برای اتصال مستقیمِ اپ به Gemini
// Live صادر می‌کند. از این نقطه به بعد صدا مستقیم بین اپ و Gemini رد و بدل
// می‌شود؛ Go در مسیر صدا قرار نمی‌گیرد. احرازهویت کاربر همین الان چک می‌شود
// تا این endpoint هم مثل بقیه‌ی API عمومی نباشد؛ اتصال به credit/session در
// فاز بعد (بعد از تایید کیفیت PoC) اضافه می‌شود.
func (h Handler) IssueToken(c echo.Context) error {
	if _, err := claims.GetClaims(c); err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت نامعتبر است",
		})
	}

	apiKey := h.settings.Get(settingsservice.KeyGeminiAPIKey)
	if apiKey == "" {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{
			"error":   "gemini_not_configured",
			"message": "کلید Gemini تنظیم نشده است",
		})
	}

	ctx := c.Request().Context()

	httpClient, err := outboundhttp.Client()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "outbound_client_failed",
			"message": err.Error(),
		})
	}

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:     apiKey,
		Backend:    genai.BackendGeminiAPI,
		HTTPClient: httpClient,
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "gemini_client_failed",
			"message": err.Error(),
		})
	}

	expireAt := time.Now().Add(defaultTokenTTL)
	authToken, err := client.AuthTokens.Create(ctx, &genai.CreateAuthTokenConfig{
		ExpireTime: expireAt,
		Uses:       genai.Ptr(int32(1)),
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "token_issue_failed",
			"message": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, tokenResponse{
		Token:    authToken.Name,
		Model:    liveModel(),
		ExpireAt: expireAt,
	})
}
