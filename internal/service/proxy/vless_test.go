package proxyservice

import (
	"encoding/json"
	"testing"
)

func TestParseVlessLink_Reality(t *testing.T) {
	link := "vless://39c42b0a-b823-4c93-bb99-74b4183e518d@85.155.226.140:443?security=reality&encryption=none&pbk=5Z6PwoPSNBLPIsX8lZtHM7-Y-psMMR1vz5Pit0EVISs&headerType=none&type=tcp&flow=xtls-rprx-vision&sni=getsavesafe.net&sid=82f5d3a1e9c0b661#Free%20342"

	cfg, err := parseVlessLink(link, 1080)
	if err != nil {
		t.Fatalf("parseVlessLink failed: %v", err)
	}

	data, err := cfg.toJSON()
	if err != nil {
		t.Fatalf("toJSON failed: %v", err)
	}

	var parsed map[string]any
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("output is not valid JSON: %v", err)
	}

	inbounds := parsed["inbounds"].([]any)
	if len(inbounds) != 1 {
		t.Fatalf("expected 1 inbound, got %d", len(inbounds))
	}
	inbound := inbounds[0].(map[string]any)
	if inbound["port"].(float64) != 1080 || inbound["protocol"] != "socks" {
		t.Fatalf("unexpected inbound: %+v", inbound)
	}

	outbounds := parsed["outbounds"].([]any)
	if len(outbounds) != 3 {
		t.Fatalf("expected 3 outbounds, got %d", len(outbounds))
	}
	proxyOut := outbounds[0].(map[string]any)
	if proxyOut["protocol"] != "vless" {
		t.Fatalf("expected first outbound protocol vless, got %v", proxyOut["protocol"])
	}
	stream := proxyOut["streamSettings"].(map[string]any)
	if stream["security"] != "reality" {
		t.Fatalf("expected reality security, got %v", stream["security"])
	}
	reality := stream["realitySettings"].(map[string]any)
	if reality["publicKey"] != "5Z6PwoPSNBLPIsX8lZtHM7-Y-psMMR1vz5Pit0EVISs" {
		t.Fatalf("unexpected publicKey: %v", reality["publicKey"])
	}
	if reality["shortId"] != "82f5d3a1e9c0b661" {
		t.Fatalf("unexpected shortId: %v", reality["shortId"])
	}
	if reality["serverName"] != "getsavesafe.net" {
		t.Fatalf("unexpected serverName: %v", reality["serverName"])
	}

	settings := proxyOut["settings"].(map[string]any)
	vnext := settings["vnext"].([]any)[0].(map[string]any)
	if vnext["address"] != "85.155.226.140" || vnext["port"].(float64) != 443 {
		t.Fatalf("unexpected vnext: %+v", vnext)
	}
	user := vnext["users"].([]any)[0].(map[string]any)
	if user["id"] != "39c42b0a-b823-4c93-bb99-74b4183e518d" || user["flow"] != "xtls-rprx-vision" {
		t.Fatalf("unexpected user: %+v", user)
	}
}

func TestParseVlessLink_WsTls(t *testing.T) {
	link := "vless://ebc0ae8a-135b-477e-baf8-9eced85e370b@apk.bestforcast.ir:3333?security=tls&type=ws&headerType=&path=&host=apk.bestforcast.ir&sni=main.bestforcast.ir&fp=random#Germany"

	cfg, err := parseVlessLink(link, 1080)
	if err != nil {
		t.Fatalf("parseVlessLink failed: %v", err)
	}
	data, _ := cfg.toJSON()
	var parsed map[string]any
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("output is not valid JSON: %v", err)
	}
	proxyOut := parsed["outbounds"].([]any)[0].(map[string]any)
	stream := proxyOut["streamSettings"].(map[string]any)
	if stream["security"] != "tls" || stream["network"] != "ws" {
		t.Fatalf("unexpected stream: %+v", stream)
	}
	tls := stream["tlsSettings"].(map[string]any)
	if tls["serverName"] != "main.bestforcast.ir" {
		t.Fatalf("unexpected tls serverName: %v", tls["serverName"])
	}
	ws := stream["wsSettings"].(map[string]any)
	if ws["path"] != "/" {
		t.Fatalf("expected default ws path '/', got %v", ws["path"])
	}
	headers := ws["headers"].(map[string]any)
	if headers["Host"] != "apk.bestforcast.ir" {
		t.Fatalf("unexpected ws host header: %v", headers["Host"])
	}
}

func TestParseVlessLink_TcpHttpObfuscation(t *testing.T) {
	link := "vless://ebc0ae8a-135b-477e-baf8-9eced85e370b@all.novahomedesigntips.com:8590?security=none&type=tcp&headerType=http&path=%2Fred&host=play.google.com#Hamrah"

	cfg, err := parseVlessLink(link, 1080)
	if err != nil {
		t.Fatalf("parseVlessLink failed: %v", err)
	}
	data, _ := cfg.toJSON()
	var parsed map[string]any
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("output is not valid JSON: %v", err)
	}
	proxyOut := parsed["outbounds"].([]any)[0].(map[string]any)
	stream := proxyOut["streamSettings"].(map[string]any)
	if stream["security"] != "none" || stream["network"] != "tcp" {
		t.Fatalf("unexpected stream: %+v", stream)
	}
	tcpSettings, ok := stream["tcpSettings"].(map[string]any)
	if !ok {
		t.Fatalf("expected tcpSettings to be present, got stream: %+v", stream)
	}
	header := tcpSettings["header"].(map[string]any)
	if header["type"] != "http" {
		t.Fatalf("expected header type http, got %v", header["type"])
	}
	request := header["request"].(map[string]any)
	paths := request["path"].([]any)
	if len(paths) != 1 || paths[0] != "/red" {
		t.Fatalf("unexpected request path: %+v", paths)
	}
	headers := request["headers"].(map[string]any)
	hostVals := headers["Host"].([]any)
	if len(hostVals) != 1 || hostVals[0] != "play.google.com" {
		t.Fatalf("unexpected request Host header: %+v", hostVals)
	}
}

func TestParseVlessLink_Xhttp(t *testing.T) {
	link := "vless://ebc0ae8a-135b-477e-baf8-9eced85e370b@apk.lifeisjustaclickaway.com:2087?security=tls&type=xhttp&path=%2FDL%3Fed%3D2096&host=apk.lifeisjustaclickaway.com&mode=auto&sni=apk.lifeisjustaclickaway.com#Notice"

	cfg, err := parseVlessLink(link, 1080)
	if err != nil {
		t.Fatalf("parseVlessLink failed: %v", err)
	}
	data, _ := cfg.toJSON()
	var parsed map[string]any
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("output is not valid JSON: %v", err)
	}
	proxyOut := parsed["outbounds"].([]any)[0].(map[string]any)
	stream := proxyOut["streamSettings"].(map[string]any)
	if stream["network"] != "xhttp" {
		t.Fatalf("unexpected network: %v", stream["network"])
	}
	xhttp, ok := stream["xhttpSettings"].(map[string]any)
	if !ok {
		t.Fatalf("expected xhttpSettings to be present, got stream: %+v", stream)
	}
	if xhttp["path"] != "/DL?ed=2096" || xhttp["host"] != "apk.lifeisjustaclickaway.com" || xhttp["mode"] != "auto" {
		t.Fatalf("unexpected xhttpSettings: %+v", xhttp)
	}
}

func TestParseVlessLink_RejectsNonVless(t *testing.T) {
	if _, err := parseVlessLink("vmess://abc", 1080); err == nil {
		t.Fatal("expected error for non-vless link")
	}
}

func TestParseVlessLink_RejectsIncomplete(t *testing.T) {
	if _, err := parseVlessLink("vless://@:443", 1080); err == nil {
		t.Fatal("expected error for incomplete link")
	}
}
