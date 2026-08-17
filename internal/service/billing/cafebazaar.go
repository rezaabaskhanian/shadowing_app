package billingservice

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

// CafeBazaarClient - کلاینت API رسمی «تأیید خرید سمت سرور» کافه‌بازار
// (Cafe Bazaar Developer API / Poolakey). این پیاده‌سازی بر اساس ساختار
// عمومی و مستندشده‌ی این API نوشته شده؛ چون صفحه‌ی راهنمای رسمی
// (developers.cafebazaar.ir) یک SPA است و مستقیم قابل fetch نبود، حتماً قبل
// از رفتن به پروداکشن مسیرها/پارامترها را با مستندات واقعی مطابقت بده.
//
// جریان کار:
//  1. با client_id/client_secret/refresh_token یک access_token می‌گیریم
//     (کش می‌شود تا وقتی منقضی شود).
//  2. با آن access_token، purchaseToken هر خرید را از سرور کافه‌بازار
//     validate می‌کنیم (نه فقط اعتماد به چیزی که کلاینت موبایل گفته).
type CafeBazaarClient struct {
	packageName  string
	clientID     string
	clientSecret string
	refreshToken string

	http *http.Client

	mu          sync.Mutex
	accessToken string
	expiresAt   time.Time
}

func NewCafeBazaarClient(packageName, clientID, clientSecret, refreshToken string) *CafeBazaarClient {
	return &CafeBazaarClient{
		packageName:  packageName,
		clientID:     clientID,
		clientSecret: clientSecret,
		refreshToken: refreshToken,
		http:         &http.Client{Timeout: 15 * time.Second},
	}
}

// Enabled یعنی همه‌ی متغیرهای لازم برای اتصال به کافه‌بازار ست شده‌اند.
func (c *CafeBazaarClient) Enabled() bool {
	return c.packageName != "" && c.clientID != "" && c.clientSecret != "" && c.refreshToken != ""
}

type tokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	TokenType   string `json:"token_type"`
}

const cafebazaarTokenURL = "https://pardakht.cafebazaar.ir/devapi/v2/auth/token/"

// accessTokenValue توکن دسترسی معتبر فعلی را برمی‌گرداند؛ اگر منقضی یا خالی
// باشد، یک توکن تازه با refresh_token می‌گیرد.
func (c *CafeBazaarClient) accessTokenValue(ctx context.Context) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.accessToken != "" && time.Now().Before(c.expiresAt) {
		return c.accessToken, nil
	}

	form := url.Values{
		"grant_type":    {"refresh_token"},
		"client_id":     {c.clientID},
		"client_secret": {c.clientSecret},
		"refresh_token": {c.refreshToken},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cafebazaarTokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", fmt.Errorf("build token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("call cafebazaar token endpoint: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		msg, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return "", fmt.Errorf("cafebazaar token endpoint returned %d: %s", resp.StatusCode, strings.TrimSpace(string(msg)))
	}

	var tr tokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tr); err != nil {
		return "", fmt.Errorf("decode cafebazaar token response: %w", err)
	}
	if tr.AccessToken == "" {
		return "", fmt.Errorf("cafebazaar token response missing access_token")
	}

	c.accessToken = tr.AccessToken
	// کمی زودتر از انقضای واقعی منقضی‌اش می‌کنیم تا لبه‌ی زمانی مشکل نسازد.
	expiresIn := tr.ExpiresIn
	if expiresIn <= 0 {
		expiresIn = 3600
	}
	c.expiresAt = time.Now().Add(time.Duration(expiresIn-30) * time.Second)

	return c.accessToken, nil
}

// PurchaseState وضعیت خرید طبق پاسخ کافه‌بازار.
type PurchaseState int

const (
	PurchaseStatePurchased PurchaseState = 0
	PurchaseStateRefunded  PurchaseState = 1
)

type purchaseValidationResponse struct {
	PurchaseState    *int   `json:"purchaseState"`
	ConsumptionState *int   `json:"consumptionState"`
	Kind             string `json:"kind"`
}

// ValidatePurchase یک purchaseToken خرید درون‌برنامه‌ای (نه اشتراک) را سمت
// سرور کافه‌بازار تأیید می‌کند. اگر خرید واقعاً انجام و پرداخت شده باشد nil
// برمی‌گرداند؛ در غیر این صورت خطا.
func (c *CafeBazaarClient) ValidatePurchase(ctx context.Context, productID, purchaseToken string) error {
	if !c.Enabled() {
		return fmt.Errorf("cafebazaar billing not configured")
	}

	token, err := c.accessTokenValue(ctx)
	if err != nil {
		return fmt.Errorf("get access token: %w", err)
	}

	validateURL := fmt.Sprintf(
		"https://pardakht.cafebazaar.ir/devapi/v2/api/validate/%s/inapp/%s/purchases/%s/",
		url.PathEscape(c.packageName), url.PathEscape(productID), url.PathEscape(purchaseToken),
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, validateURL, nil)
	if err != nil {
		return fmt.Errorf("build validate request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("call cafebazaar validate endpoint: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		msg, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return fmt.Errorf("cafebazaar validate endpoint returned %d: %s", resp.StatusCode, strings.TrimSpace(string(msg)))
	}

	var pv purchaseValidationResponse
	if err := json.NewDecoder(resp.Body).Decode(&pv); err != nil {
		return fmt.Errorf("decode cafebazaar validate response: %w", err)
	}

	if pv.PurchaseState == nil || PurchaseState(*pv.PurchaseState) != PurchaseStatePurchased {
		return fmt.Errorf("purchase not in a valid 'purchased' state")
	}

	return nil
}
