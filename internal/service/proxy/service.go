// Package proxyservice یک لینک vless:// را که ادمین از پنل پیست می‌کند به کانفیگ
// Xray-core تبدیل می‌کند، در یک ولوم مشترک با کانتینر xray (سرویس sidecar در
// docker-compose.prod.yaml) می‌نویسد، و بعد از چند ثانیه (زمانی که xray کانفیگ
// جدید را تشخیص داده و ری‌استارت می‌کند) اتصال را از طریق همان پراکسی که
// outboundhttp.Client برای Gemini/Anthropic/ElevenLabs استفاده می‌کند تست می‌کند.
package proxyservice

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"shadowing-backend/internal/pkg/outboundhttp"
	"shadowing-backend/internal/pkg/richerror"
	settingsservice "shadowing-backend/internal/service/settings"
)

const (
	// KeyV2RayLink کلید ذخیره‌ی آخرین لینک vless در تنظیمات (برای نمایش در پنل بعد از رفرش).
	KeyV2RayLink = "V2RAY_LINK"

	// مدتی که بعد از نوشتن کانفیگ جدید صبر می‌کنیم تا سایدکار xray آن را بارگذاری کند
	// (چون xray با یک حلقه‌ی poll هر ۳ ثانیه چک‌سام فایل کانفیگ را می‌بیند).
	reloadWait = 5 * time.Second

	statusCheckURL     = "https://ipinfo.io/json"
	statusCheckTimeout = 12 * time.Second
)

type Status struct {
	Connected bool   `json:"connected"`
	IP        string `json:"ip,omitempty"`
	Country   string `json:"country,omitempty"`
	Org       string `json:"org,omitempty"`
	Message   string `json:"message"`
}

type Service struct {
	settings   *settingsservice.Service
	configPath string
	socksPort  int
}

func New(settings *settingsservice.Service) Service {
	configPath := os.Getenv("XRAY_CONFIG_PATH")
	if configPath == "" {
		configPath = "/xray-config/config.json"
	}
	socksPort := 1080
	if v, err := strconv.Atoi(os.Getenv("XRAY_SOCKS_PORT")); err == nil && v > 0 {
		socksPort = v
	}
	return Service{settings: settings, configPath: configPath, socksPort: socksPort}
}

// CurrentLink آخرین لینکی که ادمین ثبت کرده را برمی‌گرداند (برای پرکردن فرم در پنل).
func (s Service) CurrentLink() string {
	return s.settings.Get(KeyV2RayLink)
}

// Connect لینک جدید را پارس، کانفیگ Xray را می‌نویسد، لینک را در تنظیمات ذخیره
// می‌کند و بعد از مکث کوتاه (تا سایدکار xray ری‌لود کند) وضعیت اتصال را برمی‌گرداند.
func (s Service) Connect(ctx context.Context, link string) (Status, error) {
	const op = "proxyservice.Connect"

	cfg, err := parseVlessLink(link, s.socksPort)
	if err != nil {
		return Status{}, richerror.New(op).WithErr(err).WithMessage(err.Error())
	}

	data, err := cfg.toJSON()
	if err != nil {
		return Status{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت کانفیگ")
	}

	if err := writeAtomic(s.configPath, data); err != nil {
		return Status{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در نوشتن کانفیگ (%s): %v", s.configPath, err))
	}

	if err := s.settings.Set(ctx, KeyV2RayLink, link); err != nil {
		return Status{}, richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی لینک")
	}

	select {
	case <-time.After(reloadWait):
	case <-ctx.Done():
		return Status{}, ctx.Err()
	}

	return s.checkStatus(ctx), nil
}

// Status اتصال فعلی را (بدون تغییر کانفیگ) تست می‌کند.
func (s Service) Status(ctx context.Context) Status {
	return s.checkStatus(ctx)
}

func (s Service) checkStatus(ctx context.Context) Status {
	client, err := outboundhttp.Client()
	if err != nil {
		return Status{Connected: false, Message: fmt.Sprintf("خطا در تنظیم پراکسی: %v", err)}
	}

	reqCtx, cancel := context.WithTimeout(ctx, statusCheckTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, statusCheckURL, nil)
	if err != nil {
		return Status{Connected: false, Message: fmt.Sprintf("خطا در ساخت درخواست تست: %v", err)}
	}

	resp, err := client.Do(req)
	if err != nil {
		return Status{Connected: false, Message: fmt.Sprintf("اتصال برقرار نشد: %v", err)}
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return Status{Connected: false, Message: fmt.Sprintf("پاسخ غیرمنتظره (%d): %s", resp.StatusCode, string(body))}
	}

	var info struct {
		IP      string `json:"ip"`
		Country string `json:"country"`
		Org     string `json:"org"`
	}
	if err := json.Unmarshal(body, &info); err != nil {
		return Status{Connected: false, Message: "پاسخ سرویس تست قابل پردازش نبود"}
	}

	return Status{
		Connected: true,
		IP:        info.IP,
		Country:   info.Country,
		Org:       info.Org,
		Message:   "متصل",
	}
}

func writeAtomic(path string, data []byte) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}
