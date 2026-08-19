package smsservice

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// Client - کلاینت API ارسال کد تایید (OTP) سرویس sms.ir
// https://app.sms.ir/developer/help/introduction
type Client struct {
	apiKey     string
	templateID int
	http       *http.Client
}

func NewClient(apiKey, templateID string) *Client {
	id, _ := strconv.Atoi(templateID)
	return &Client{
		apiKey:     apiKey,
		templateID: id,
		http:       &http.Client{Timeout: 10 * time.Second},
	}
}

// Enabled یعنی کلید و شناسه‌ی قالب لازم برای ارسال OTP ست شده‌اند.
func (c *Client) Enabled() bool {
	return c.apiKey != "" && c.templateID != 0
}

const smsIrVerifyURL = "https://api.sms.ir/v1/send/verify"

type verifyParameter struct {
	Name  string `json:"Name"`
	Value string `json:"Value"`
}

type verifyRequest struct {
	Mobile     string            `json:"Mobile"`
	TemplateID int               `json:"TemplateId"`
	Parameters []verifyParameter `json:"Parameters"`
}

type verifyResponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}

// SendCode کد تایید را از طریق قالب OTP از پیش تعریف‌شده روی پنل sms.ir
// به شماره‌ی داده‌شده پیامک می‌کند.
func (c *Client) SendCode(ctx context.Context, phone, code string) error {
	if !c.Enabled() {
		return fmt.Errorf("sms.ir not configured")
	}

	body := verifyRequest{
		Mobile:     phone,
		TemplateID: c.templateID,
		Parameters: []verifyParameter{{Name: "CODE", Value: code}},
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("encode sms.ir request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, smsIrVerifyURL, strings.NewReader(string(payload)))
	if err != nil {
		return fmt.Errorf("build sms.ir request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-KEY", c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("call sms.ir verify endpoint: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("sms.ir verify endpoint returned %d: %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}

	var vr verifyResponse
	if err := json.Unmarshal(respBody, &vr); err != nil {
		return fmt.Errorf("decode sms.ir verify response: %w", err)
	}
	if vr.Status != 1 {
		return fmt.Errorf("sms.ir verify failed: %s", vr.Message)
	}

	return nil
}
