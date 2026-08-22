// Package outboundhttp یک http.Client می‌سازد که در صورت تنظیم متغیر محیطی
// AI_OUTBOUND_PROXY، ترافیک خروجی را از یک پراکسی (socks5 یا http/https) عبور
// می‌دهد. این برای دور زدن بلاک جغرافیایی سرویس‌هایی مثل Gemini، Anthropic و
// ElevenLabs روی سرورهایی که IP‌شان از این سرویس‌ها مسدود است (مثل سرورهای
// ایران) استفاده می‌شود. اگر متغیر تنظیم نشده باشد، کلاینت پیش‌فرض بدون پراکسی
// برگردانده می‌شود.
package outboundhttp

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"

	"golang.org/x/net/proxy"
)

const proxyEnvVar = "AI_OUTBOUND_PROXY"

// Client یک *http.Client آماده برای فراخوانی سرویس‌های هوش مصنوعی خارجی برمی‌گرداند.
func Client() (*http.Client, error) {
	raw := strings.TrimSpace(os.Getenv(proxyEnvVar))
	if raw == "" {
		return http.DefaultClient, nil
	}

	proxyURL, err := url.Parse(raw)
	if err != nil {
		return nil, fmt.Errorf("%s نامعتبر است: %w", proxyEnvVar, err)
	}

	transport := &http.Transport{}

	switch proxyURL.Scheme {
	case "socks5", "socks5h":
		dialer, err := proxy.FromURL(proxyURL, proxy.Direct)
		if err != nil {
			return nil, fmt.Errorf("ساخت دایلر socks5 برای %s ناموفق بود: %w", proxyEnvVar, err)
		}
		transport.DialContext = func(_ context.Context, network, addr string) (net.Conn, error) {
			return dialer.Dial(network, addr)
		}
	case "http", "https":
		transport.Proxy = http.ProxyURL(proxyURL)
	default:
		return nil, fmt.Errorf("%s: پروتکل پراکسی پشتیبانی نمی‌شود: %q", proxyEnvVar, proxyURL.Scheme)
	}

	return &http.Client{Transport: transport}, nil
}
