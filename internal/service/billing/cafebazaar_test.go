package billingservice

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newTestClient(t *testing.T, handler http.HandlerFunc) *CafeBazaarClient {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)
	c := NewCafeBazaarClient("com.shadowingapp", "secret-token")
	c.baseURL = srv.URL
	return c
}

func TestValidatePurchaseSendsPishkhanHeaderAndPath(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Errorf("method = %s, want GET", r.Method)
		}
		if got := r.Header.Get("CAFEBAZAAR-PISHKHAN-API-SECRET"); got != "secret-token" {
			t.Errorf("auth header = %q", got)
		}
		if r.Header.Get("Authorization") != "" {
			t.Error("old OAuth Authorization header must not be sent")
		}
		want := "/validate/com.shadowingapp/inapp/shadowing_1m/purchases/tok123/"
		if r.URL.Path != want {
			t.Errorf("path = %q, want %q", r.URL.Path, want)
		}
		_, _ = w.Write([]byte(`{"consumptionState":1,"purchaseState":0,"kind":"androidpublisher#inappPurchase","developerPayload":"","purchaseTime":1414181378566}`))
	})

	if err := c.ValidatePurchase(context.Background(), "shadowing_1m", "tok123"); err != nil {
		t.Fatalf("expected valid purchase, got %v", err)
	}
}

func TestValidatePurchaseRejects(t *testing.T) {
	cases := []struct {
		name    string
		status  int
		body    string
		wantErr string
	}{
		{"refunded", 200, `{"consumptionState":1,"purchaseState":1}`, "refunded"},
		{"missing state", 200, `{"kind":"androidpublisher#inappPurchase"}`, "missing purchaseState"},
		{"not found", 404, `{"error":"not_found","error_description":"The requested purchase is not found!"}`, "not found"},
		{"bad package", 404, `{"error":"invalid_value","error_description":"Package name is invalid"}`, "404"},
		{"bad secret", 401, `{"detail":"unauthorized"}`, "401"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.status)
				_, _ = w.Write([]byte(tc.body))
			})
			err := c.ValidatePurchase(context.Background(), "shadowing_1m", "tok")
			if err == nil || !strings.Contains(err.Error(), tc.wantErr) {
				t.Fatalf("want error containing %q, got %v", tc.wantErr, err)
			}
		})
	}
}

func TestEnabledRequiresPackageAndSecret(t *testing.T) {
	if NewCafeBazaarClient("com.shadowingapp", "").Enabled() {
		t.Error("enabled without secret")
	}
	if NewCafeBazaarClient("", "x").Enabled() {
		t.Error("enabled without package")
	}
	if !NewCafeBazaarClient("com.shadowingapp", " x ").Enabled() {
		t.Error("should be enabled")
	}
}
