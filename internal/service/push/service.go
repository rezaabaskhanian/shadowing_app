package pushservice

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"shadowing-backend/internal/pkg/richerror"
	settingsservice "shadowing-backend/internal/service/settings"

	"golang.org/x/oauth2/google"
)

const fcmScope = "https://www.googleapis.com/auth/firebase.messaging"

// Service پیام‌های Push را از طریق Firebase Cloud Messaging (HTTP v1 API) ارسال
// می‌کند. کلید سرویس (service account JSON) در لحظه‌ی هر درخواست از settings
// خوانده می‌شود تا تغییر آن از پنل ادمین بدون ری‌استارت سرور اعمال شود. FCM
// خودش پیام را برای iOS به APNs و برای اندروید مستقیم می‌فرستد؛ نیازی به
// یکپارچه‌سازی جدای APNs نیست.
type Service struct {
	settings *settingsservice.Service
}

func New(settings *settingsservice.Service) Service {
	return Service{settings: settings}
}

func (s Service) serviceAccountJSON() string {
	return s.settings.Get(settingsservice.KeyFCMServiceAccount)
}

// Enabled مشخص می‌کند آیا کلید سرویس FCM تنظیم شده است یا نه.
func (s Service) Enabled() bool {
	return s.serviceAccountJSON() != ""
}

// SendToTokens یک پیام را به لیستی از توکن‌های دستگاه می‌فرستد؛ تعداد ارسال‌های
// موفق را برمی‌گرداند و خطاهای تک‌توکنی را نادیده می‌گیرد (توکن نامعتبر/منقضی
// نباید کل ارسال همگانی را متوقف کند).
func (s Service) SendToTokens(ctx context.Context, tokens []string, title, body string) (int, error) {
	const op = "pushservice.SendToTokens"

	keyJSON := s.serviceAccountJSON()
	if keyJSON == "" {
		return 0, richerror.New(op).WithMessage("کلید FCM_SERVICE_ACCOUNT_JSON تنظیم نشده است")
	}

	var parsed struct {
		ProjectID string `json:"project_id"`
	}
	if err := json.Unmarshal([]byte(keyJSON), &parsed); err != nil || parsed.ProjectID == "" {
		return 0, richerror.New(op).WithMessage("کلید سرویس FCM نامعتبر است (project_id یافت نشد)")
	}

	jwtConfig, err := google.JWTConfigFromJSON([]byte(keyJSON), fcmScope)
	if err != nil {
		return 0, richerror.New(op).WithErr(err).WithMessage("کلید سرویس FCM نامعتبر است")
	}
	client := jwtConfig.Client(ctx)

	endpoint := fmt.Sprintf("https://fcm.googleapis.com/v1/projects/%s/messages:send", parsed.ProjectID)

	sent := 0
	for _, token := range tokens {
		payload, err := json.Marshal(map[string]any{
			"message": map[string]any{
				"token": token,
				"notification": map[string]string{
					"title": title,
					"body":  body,
				},
			},
		})
		if err != nil {
			continue
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payload))
		if err != nil {
			continue
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			continue
		}
		_, _ = io.Copy(io.Discard, resp.Body)
		resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			sent++
		}
	}

	return sent, nil
}
