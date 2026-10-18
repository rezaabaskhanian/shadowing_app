package proxyservice

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

// xrayConfig ساختار حداقلیِ کانفیگ Xray-core است: یک اینباند SOCKS5 محلی برای
// استفاده‌ی بک‌اند (از طریق AI_OUTBOUND_PROXY) و یک آوت‌باند vless به سرور پراکسی.
type xrayConfig struct {
	Log       xrayLog        `json:"log"`
	Inbounds  []xrayInbound  `json:"inbounds"`
	Outbounds []xrayOutbound `json:"outbounds"`
}

type xrayLog struct {
	Loglevel string `json:"loglevel"`
}

type xrayInbound struct {
	Listen   string             `json:"listen"`
	Port     int                `json:"port"`
	Protocol string             `json:"protocol"`
	Settings xraySocksInSetting `json:"settings"`
}

type xraySocksInSetting struct {
	Auth string `json:"auth"`
	UDP  bool   `json:"udp"`
}

type xrayOutbound struct {
	Tag            string         `json:"tag"`
	Protocol       string         `json:"protocol"`
	Settings       map[string]any `json:"settings"`
	StreamSettings map[string]any `json:"streamSettings,omitempty"`
}

// parseProxyLink بر اساس پیشوند لینک، پارسرِ مناسب را صدا می‌زند.
func parseProxyLink(link string, socksPort int) (xrayConfig, error) {
	link = strings.TrimSpace(link)
	switch {
	case strings.HasPrefix(link, "vless://"):
		return parseVlessLink(link, socksPort)
	case strings.HasPrefix(link, "ss://"):
		return parseShadowsocksLink(link, socksPort)
	default:
		return xrayConfig{}, fmt.Errorf("فقط لینک‌های vless:// و ss:// پشتیبانی می‌شوند")
	}
}

// parseShadowsocksLink لینک ss:// را به کانفیگ Xray تبدیل می‌کند. هر دو فرمت رایج:
// SIP002 یعنی ss://base64(method:password)@host:port#name (userinfo گاهی base64
// نیست و فقط percent-encoded است)، و فرمت قدیمی ss://base64(method:password@host:port)#name.
// پلاگین‌ها (obfs/v2ray-plugin) پشتیبانی نمی‌شوند.
func parseShadowsocksLink(link string, socksPort int) (xrayConfig, error) {
	rest := strings.TrimPrefix(strings.TrimSpace(link), "ss://")
	if i := strings.IndexByte(rest, '#'); i >= 0 {
		rest = rest[:i]
	}
	if i := strings.IndexByte(rest, '?'); i >= 0 {
		q, _ := url.ParseQuery(rest[i+1:])
		if q.Get("plugin") != "" {
			return xrayConfig{}, fmt.Errorf("لینک‌های Shadowsocks با plugin پشتیبانی نمی‌شوند")
		}
		rest = rest[:i]
	}
	rest = strings.TrimSuffix(rest, "/")

	var userinfo, hostport string
	if at := strings.LastIndexByte(rest, '@'); at >= 0 {
		userinfo, hostport = rest[:at], rest[at+1:]
		if dec, ok := decodeBase64(userinfo); ok && strings.Contains(dec, ":") {
			userinfo = dec
		} else if unesc, err := url.PathUnescape(userinfo); err == nil {
			userinfo = unesc
		}
	} else {
		dec, ok := decodeBase64(rest)
		at := strings.LastIndexByte(dec, '@')
		if !ok || at < 0 {
			return xrayConfig{}, fmt.Errorf("لینک Shadowsocks قابل‌خواندن نیست")
		}
		userinfo, hostport = dec[:at], dec[at+1:]
	}

	method, password, ok := strings.Cut(userinfo, ":")
	if !ok || method == "" || password == "" {
		return xrayConfig{}, fmt.Errorf("لینک ناقص است (method/password پیدا نشد)")
	}
	u, err := url.Parse("ss://" + hostport)
	if err != nil || u.Hostname() == "" || u.Port() == "" {
		return xrayConfig{}, fmt.Errorf("لینک ناقص است (host/port پیدا نشد)")
	}
	port, err := strconv.Atoi(u.Port())
	if err != nil {
		return xrayConfig{}, fmt.Errorf("پورت نامعتبر است: %w", err)
	}

	return newXrayConfig(socksPort, xrayOutbound{
		Tag:      "proxy",
		Protocol: "shadowsocks",
		Settings: map[string]any{
			"servers": []map[string]any{
				{"address": u.Hostname(), "port": port, "method": method, "password": password},
			},
		},
	}), nil
}

// decodeBase64 هر چهار گونه‌ی base64 رایج در لینک‌ها را امتحان می‌کند.
func decodeBase64(s string) (string, bool) {
	for _, enc := range []*base64.Encoding{base64.StdEncoding, base64.RawStdEncoding, base64.URLEncoding, base64.RawURLEncoding} {
		if b, err := enc.DecodeString(s); err == nil {
			return string(b), true
		}
	}
	return "", false
}

// newXrayConfig کانفیگ کامل را با اینباند SOCKS محلی و آوت‌باندِ پراکسیِ داده‌شده می‌سازد.
func newXrayConfig(socksPort int, proxy xrayOutbound) xrayConfig {
	return xrayConfig{
		Log: xrayLog{Loglevel: "warning"},
		Inbounds: []xrayInbound{
			{
				Listen:   "0.0.0.0",
				Port:     socksPort,
				Protocol: "socks",
				Settings: xraySocksInSetting{Auth: "noauth", UDP: true},
			},
		},
		Outbounds: []xrayOutbound{
			proxy,
			{Tag: "direct", Protocol: "freedom", Settings: map[string]any{}},
			{Tag: "block", Protocol: "blackhole", Settings: map[string]any{}},
		},
	}
}

// parseVlessLink یک لینک vless:// (فرمت رایج در سابسکریپشن‌های عمومی V2Ray) را
// به کانفیگ Xray-core تبدیل می‌کند. فقط vless پشتیبانی می‌شود، با ترکیب‌های
// امنیتی/ترنسپورت رایج: reality، tls، و tcp/ws/xhttp (شامل هدر HTTP obfuscation).
func parseVlessLink(link string, socksPort int) (xrayConfig, error) {
	link = strings.TrimSpace(link)
	if !strings.HasPrefix(link, "vless://") {
		return xrayConfig{}, fmt.Errorf("فقط لینک‌های vless:// پشتیبانی می‌شوند")
	}

	u, err := url.Parse(link)
	if err != nil {
		return xrayConfig{}, fmt.Errorf("لینک قابل‌خواندن نیست: %w", err)
	}

	uuid := u.User.Username()
	host := u.Hostname()
	portStr := u.Port()
	if uuid == "" || host == "" || portStr == "" {
		return xrayConfig{}, fmt.Errorf("لینک ناقص است (uuid/host/port پیدا نشد)")
	}
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return xrayConfig{}, fmt.Errorf("پورت نامعتبر است: %w", err)
	}

	q := u.Query()
	get := func(key, def string) string {
		if v := q.Get(key); v != "" {
			return v
		}
		return def
	}

	user := map[string]any{
		"id":         uuid,
		"encryption": get("encryption", "none"),
	}
	if flow := q.Get("flow"); flow != "" {
		user["flow"] = flow
	}

	network := get("type", "tcp")
	security := get("security", "none")
	stream := map[string]any{
		"network":  network,
		"security": security,
	}

	switch security {
	case "reality":
		stream["realitySettings"] = map[string]any{
			"serverName":  get("sni", host),
			"fingerprint": get("fp", "chrome"),
			"publicKey":   q.Get("pbk"),
			"shortId":     q.Get("sid"),
		}
	case "tls":
		stream["tlsSettings"] = map[string]any{
			"serverName":    get("sni", host),
			"allowInsecure": q.Get("allowInsecure") == "1" || q.Get("insecure") == "1",
		}
	}

	switch network {
	case "ws":
		path := q.Get("path")
		if path == "" {
			path = "/"
		}
		stream["wsSettings"] = map[string]any{
			"path":    path,
			"headers": map[string]any{"Host": get("host", host)},
		}
	case "tcp":
		if get("headerType", "") == "http" {
			path := q.Get("path")
			if path == "" {
				path = "/"
			}
			stream["tcpSettings"] = map[string]any{
				"header": map[string]any{
					"type": "http",
					"request": map[string]any{
						"path":    []string{path},
						"headers": map[string]any{"Host": []string{get("host", host)}},
					},
				},
			}
		}
	case "xhttp":
		stream["xhttpSettings"] = map[string]any{
			"path": get("path", "/"),
			"host": get("host", host),
			"mode": get("mode", "auto"),
		}
	}

	return newXrayConfig(socksPort, xrayOutbound{
		Tag:      "proxy",
		Protocol: "vless",
		Settings: map[string]any{
			"vnext": []map[string]any{
				{
					"address": host,
					"port":    port,
					"users":   []map[string]any{user},
				},
			},
		},
		StreamSettings: stream,
	}), nil
}

func (c xrayConfig) toJSON() ([]byte, error) {
	return json.MarshalIndent(c, "", "  ")
}
