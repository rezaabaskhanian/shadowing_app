// Package outboundhttp یک http.Client می‌سازد که در صورت تنظیم متغیر محیطی
// AI_OUTBOUND_PROXY، ترافیک خروجی را از یک پراکسی (socks5 یا http/https) عبور
// می‌دهد. این برای دور زدن بلاک جغرافیایی سرویس‌هایی مثل Gemini، Anthropic و
// ElevenLabs روی سرورهایی که IP‌شان از این سرویس‌ها مسدود است (مثل سرورهای
// ایران) استفاده می‌شود. اگر متغیر تنظیم نشده باشد، کلاینت پیش‌فرض بدون پراکسی
// برگردانده می‌شود.
//
// راه دوم، AI_RELAY_URL است: به جای پراکسی، هر درخواست به یک رله‌ی HTTPS (مثلاً
// یک Cloudflare Worker؛ deploy/relay-worker.js) فرستاده می‌شود و رله آن را به
// میزبان اصلی می‌رساند. اگر هر دو تنظیم شده باشند، رله اولویت دارد.
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

const (
	proxyEnvVar    = "AI_OUTBOUND_PROXY"
	relayEnvVar    = "AI_RELAY_URL"
	relayKeyEnvVar = "AI_RELAY_KEY"

	// RelayHostHeader میزبانِ اصلیِ درخواست را به رله می‌گوید؛ RelayKeyHeader
	// کلید مشترک است تا رله برای هر کسی پراکسیِ باز نباشد.
	RelayHostHeader = "X-Relay-Host"
	RelayKeyHeader  = "X-Relay-Key"
)

// Client یک *http.Client آماده برای فراخوانی سرویس‌های هوش مصنوعی خارجی برمی‌گرداند.
func Client() (*http.Client, error) {
	if relay := strings.TrimSpace(os.Getenv(relayEnvVar)); relay != "" {
		return relayClient(relay, strings.TrimSpace(os.Getenv(relayKeyEnvVar)))
	}

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

// relayTransport هر درخواست را به آدرس رله بازنویسی می‌کند: مسیر و query همان
// می‌ماند، میزبان اصلی در هدر X-Relay-Host می‌رود و رله آن را به https://<host> می‌فرستد.
type relayTransport struct {
	base  http.RoundTripper
	relay *url.URL
	key   string
}

func (t relayTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	r := req.Clone(req.Context())
	r.Header.Set(RelayHostHeader, req.URL.Host)
	if t.key != "" {
		r.Header.Set(RelayKeyHeader, t.key)
	}
	u := *req.URL
	u.Scheme, u.Host = t.relay.Scheme, t.relay.Host
	u.Path = strings.TrimSuffix(t.relay.Path, "/") + req.URL.Path
	if req.URL.RawPath != "" {
		u.RawPath = strings.TrimSuffix(t.relay.Path, "/") + req.URL.RawPath
	}
	r.URL, r.Host = &u, t.relay.Host
	return t.base.RoundTrip(r)
}

func relayClient(raw, key string) (*http.Client, error) {
	relayURL, err := url.Parse(raw)
	if err != nil || relayURL.Host == "" || (relayURL.Scheme != "https" && relayURL.Scheme != "http") {
		return nil, fmt.Errorf("%s نامعتبر است: %q", relayEnvVar, raw)
	}
	if key == "" {
		return nil, fmt.Errorf("%s تنظیم شده ولی %s خالی است", relayEnvVar, relayKeyEnvVar)
	}
	return &http.Client{Transport: relayTransport{base: http.DefaultTransport, relay: relayURL, key: key}}, nil
}
