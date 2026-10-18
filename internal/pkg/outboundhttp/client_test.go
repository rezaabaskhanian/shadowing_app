package outboundhttp

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRelayRewritesHostPathAndHeaders(t *testing.T) {
	var gotPath, gotQuery, gotHost, gotKey, gotAuth, gotBody string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath, gotQuery = r.URL.Path, r.URL.RawQuery
		gotHost, gotKey = r.Header.Get(RelayHostHeader), r.Header.Get(RelayKeyHeader)
		gotAuth = r.Header.Get("Authorization")
		b, _ := io.ReadAll(r.Body)
		gotBody = string(b)
		w.WriteHeader(http.StatusTeapot)
	}))
	defer srv.Close()

	t.Setenv(relayEnvVar, srv.URL+"/r")
	t.Setenv(relayKeyEnvVar, "k1")
	c, err := Client()
	if err != nil {
		t.Fatal(err)
	}
	req, _ := http.NewRequest(http.MethodPost, "https://openrouter.ai/api/v1/audio/speech?x=1", strings.NewReader("hi"))
	req.Header.Set("Authorization", "Bearer sk")
	resp, err := c.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()

	if resp.StatusCode != http.StatusTeapot {
		t.Fatalf("status = %d", resp.StatusCode)
	}
	if gotPath != "/r/api/v1/audio/speech" || gotQuery != "x=1" {
		t.Fatalf("path = %q query = %q", gotPath, gotQuery)
	}
	if gotHost != "openrouter.ai" || gotKey != "k1" || gotAuth != "Bearer sk" || gotBody != "hi" {
		t.Fatalf("host=%q key=%q auth=%q body=%q", gotHost, gotKey, gotAuth, gotBody)
	}
}

func TestRelayRequiresKey(t *testing.T) {
	t.Setenv(relayEnvVar, "https://relay.example.com")
	t.Setenv(relayKeyEnvVar, "")
	if _, err := Client(); err == nil {
		t.Fatal("expected error without relay key")
	}
}
