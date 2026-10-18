package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// client با همان API ادمینِ پنل حرف می‌زند. با شماره و رمزِ ادمین لاگین می‌کند و
// اگر توکن منقضی شد (401) یک بار دوباره لاگین می‌کند.
type client struct {
	baseURL  string
	phone    string
	password string
	http     *http.Client

	mu    sync.Mutex
	token string
}

func newClient(baseURL, phone, password string) *client {
	return &client{
		baseURL:  strings.TrimRight(baseURL, "/"),
		phone:    phone,
		password: password,
		// ساخت صدا/اسکریپت با AI ممکن است طول بکشد.
		http: &http.Client{Timeout: 5 * time.Minute},
	}
}

func (c *client) login(ctx context.Context) error {
	body, _ := json.Marshal(map[string]string{"phone_number": c.phone, "password_hash": c.password})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/users/login", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	res, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("login: %w", err)
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("login failed (%d): %s", res.StatusCode, apiMessage(raw))
	}
	var out struct {
		User   struct{ Role string } `json:"user"`
		Tokens struct {
			AccessToken string `json:"access_token"`
		} `json:"tokens"`
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		return fmt.Errorf("login: bad response: %w", err)
	}
	if out.User.Role != "admin" {
		return errors.New("login: this account is not an admin")
	}
	c.token = out.Tokens.AccessToken
	return nil
}

func (c *client) currentToken(ctx context.Context, refresh bool) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.token == "" || refresh {
		if err := c.login(ctx); err != nil {
			return "", err
		}
	}
	return c.token, nil
}

// do یک درخواست می‌فرستد و بدنه‌ی خام JSON را برمی‌گرداند. newBody برای
// تکرار درخواست بعد از لاگینِ دوباره است.
func (c *client) do(ctx context.Context, method, path, contentType string, newBody func() io.Reader) ([]byte, error) {
	for attempt := 0; attempt < 2; attempt++ {
		token, err := c.currentToken(ctx, attempt > 0)
		if err != nil {
			return nil, err
		}
		var body io.Reader
		if newBody != nil {
			body = newBody()
		}
		req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, body)
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+token)
		if contentType != "" {
			req.Header.Set("Content-Type", contentType)
		}
		res, err := c.http.Do(req)
		if err != nil {
			return nil, err
		}
		raw, _ := io.ReadAll(res.Body)
		res.Body.Close()
		if res.StatusCode == http.StatusUnauthorized && attempt == 0 {
			continue
		}
		if res.StatusCode >= 300 {
			return nil, fmt.Errorf("%s %s → %d: %s", method, path, res.StatusCode, apiMessage(raw))
		}
		return raw, nil
	}
	return nil, errors.New("unauthorized")
}

func (c *client) get(ctx context.Context, path string) ([]byte, error) {
	return c.do(ctx, http.MethodGet, path, "", nil)
}

func (c *client) sendJSON(ctx context.Context, method, path string, payload any) ([]byte, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	return c.do(ctx, method, path, "application/json", func() io.Reader { return bytes.NewReader(body) })
}

// getInto درخواست GET می‌زند و جواب را در out می‌ریزد.
func (c *client) getInto(ctx context.Context, path string, out any) error {
	raw, err := c.get(ctx, path)
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, out)
}

// upload یک فایلِ محلی یا یک URL را با فیلدِ field آپلود می‌کند و url ذخیره‌شده را برمی‌گرداند.
func (c *client) upload(ctx context.Context, path, field, source string) (string, error) {
	data, name, err := readSource(ctx, c.http, source)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	part, err := w.CreateFormFile(field, name)
	if err != nil {
		return "", err
	}
	if _, err := part.Write(data); err != nil {
		return "", err
	}
	if err := w.Close(); err != nil {
		return "", err
	}
	payload := buf.Bytes()
	raw, err := c.do(ctx, http.MethodPost, path, w.FormDataContentType(), func() io.Reader { return bytes.NewReader(payload) })
	if err != nil {
		return "", err
	}
	var out struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(raw, &out); err != nil || out.URL == "" {
		return "", fmt.Errorf("upload: unexpected response: %s", string(raw))
	}
	return out.URL, nil
}

const maxUploadBytes = 200 << 20

func readSource(ctx context.Context, hc *http.Client, source string) ([]byte, string, error) {
	if strings.HasPrefix(source, "http://") || strings.HasPrefix(source, "https://") {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, source, nil)
		if err != nil {
			return nil, "", err
		}
		res, err := hc.Do(req)
		if err != nil {
			return nil, "", err
		}
		defer res.Body.Close()
		if res.StatusCode != http.StatusOK {
			return nil, "", fmt.Errorf("download %s: status %d", source, res.StatusCode)
		}
		data, err := io.ReadAll(io.LimitReader(res.Body, maxUploadBytes+1))
		if err != nil {
			return nil, "", err
		}
		if len(data) > maxUploadBytes {
			return nil, "", errors.New("file is larger than 200MB")
		}
		name := filepath.Base(strings.SplitN(res.Request.URL.Path, "?", 2)[0])
		if name == "" || name == "/" || name == "." {
			name = "file"
		}
		return data, name, nil
	}
	info, err := os.Stat(source)
	if err != nil {
		return nil, "", err
	}
	if info.Size() > maxUploadBytes {
		return nil, "", errors.New("file is larger than 200MB")
	}
	data, err := os.ReadFile(source)
	return data, filepath.Base(source), err
}

func apiMessage(raw []byte) string {
	var m map[string]any
	if json.Unmarshal(raw, &m) == nil {
		for _, k := range []string{"message", "error"} {
			if s, ok := m[k].(string); ok && s != "" {
				return s
			}
		}
	}
	s := string(raw)
	if len(s) > 500 {
		s = s[:500] + "…"
	}
	return s
}
