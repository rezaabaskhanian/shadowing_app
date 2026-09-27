package billingservice

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// CafeBazaarClient - کلاینت API «پیشخان بازار» (روش جدید) برای تأیید خرید
// درون‌برنامه‌ای سمت سرور. طبق مستند رسمی «راه اندازی API (روش جدید)»:
// توکن برای هر برنامه از پیشخان بازار ← برنامه ← «API پیشخان بازار» ←
// «دریافت توکن جدید» گرفته می‌شود و در هدر هر درخواست با کلید
// CAFEBAZAAR-PISHKHAN-API-SECRET فرستاده می‌شود. روش قدیمی OAuth
// (client_id/client_secret/refresh_token) دیگر لازم نیست.
type CafeBazaarClient struct {
	packageName string
	apiSecret   string
	baseURL     string

	http *http.Client
}

const (
	cafebazaarBaseURL    = "https://pardakht.cafebazaar.ir/devapi/v2/api"
	cafebazaarAuthHeader = "CAFEBAZAAR-PISHKHAN-API-SECRET"
)

func NewCafeBazaarClient(packageName, apiSecret string) *CafeBazaarClient {
	return &CafeBazaarClient{
		packageName: strings.TrimSpace(packageName),
		apiSecret:   strings.TrimSpace(apiSecret),
		baseURL:     cafebazaarBaseURL,
		http:        &http.Client{Timeout: 15 * time.Second},
	}
}

// Enabled یعنی نام بسته و توکن API پیشخان هر دو ست شده‌اند.
func (c *CafeBazaarClient) Enabled() bool {
	return c.packageName != "" && c.apiSecret != ""
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

type cafebazaarError struct {
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

// ValidatePurchase یک purchaseToken خرید درون‌برنامه‌ای (نه اشتراک) را سمت
// سرور کافه‌بازار تأیید می‌کند. اگر خرید واقعاً انجام شده و ریفاند نشده باشد
// nil برمی‌گرداند؛ در غیر این صورت خطا. productID در آدرس است، پس توکنِ خرید
// یک SKU ارزان‌تر برای پلن گران‌تر پذیرفته نمی‌شود.
func (c *CafeBazaarClient) ValidatePurchase(ctx context.Context, productID, purchaseToken string) error {
	if !c.Enabled() {
		return fmt.Errorf("cafebazaar billing not configured")
	}

	validateURL := fmt.Sprintf(
		"%s/validate/%s/inapp/%s/purchases/%s/",
		c.baseURL, url.PathEscape(c.packageName), url.PathEscape(productID), url.PathEscape(purchaseToken),
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, validateURL, nil)
	if err != nil {
		return fmt.Errorf("build validate request: %w", err)
	}
	req.Header.Set(cafebazaarAuthHeader, c.apiSecret)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("call cafebazaar validate endpoint: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	if err != nil {
		return fmt.Errorf("read cafebazaar validate response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var ce cafebazaarError
		if json.Unmarshal(body, &ce) == nil && ce.Error == "not_found" {
			// طبق مستند، فقط not_found یعنی خریدی انجام نشده (ممکن است جعل خرید باشد).
			return fmt.Errorf("purchase not found at cafebazaar (%s)", ce.ErrorDescription)
		}
		return fmt.Errorf("cafebazaar validate endpoint returned %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var pv purchaseValidationResponse
	if err := json.Unmarshal(body, &pv); err != nil {
		return fmt.Errorf("decode cafebazaar validate response: %w", err)
	}

	if pv.PurchaseState == nil {
		return fmt.Errorf("cafebazaar validate response missing purchaseState")
	}
	switch PurchaseState(*pv.PurchaseState) {
	case PurchaseStatePurchased:
		return nil
	case PurchaseStateRefunded:
		return fmt.Errorf("purchase was refunded")
	default:
		return fmt.Errorf("unexpected purchaseState %d", *pv.PurchaseState)
	}
}
