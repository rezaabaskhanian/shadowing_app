package proxyservice

import (
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
	Tag            string                 `json:"tag"`
	Protocol       string                 `json:"protocol"`
	Settings       map[string]any         `json:"settings"`
	StreamSettings map[string]any         `json:"streamSettings,omitempty"`
}

// parseVlessLink یک لینک vless:// (فرمت رایج در سابسکریپشن‌های عمومی V2Ray) را
// به کانفیگ Xray-core تبدیل می‌کند. فقط vless (با یا بدون reality/tls/ws)
// پشتیبانی می‌شود چون بیشتر لینک‌های عمومی از همین نوع‌اند.
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

	if network == "ws" {
		path := q.Get("path")
		if path == "" {
			path = "/"
		}
		stream["wsSettings"] = map[string]any{
			"path":    path,
			"headers": map[string]any{"Host": get("host", host)},
		}
	}

	cfg := xrayConfig{
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
			{
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
			},
			{Tag: "direct", Protocol: "freedom", Settings: map[string]any{}},
			{Tag: "block", Protocol: "blackhole", Settings: map[string]any{}},
		},
	}

	return cfg, nil
}

func (c xrayConfig) toJSON() ([]byte, error) {
	return json.MarshalIndent(c, "", "  ")
}
