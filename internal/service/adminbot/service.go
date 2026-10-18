// Package adminbotservice تعامل‌های کاربر با ادمین (پیشنهاد و انتقاد، پیشنهاد
// صحنه و موضوع، خرید) را به ربات تلگرام و/یا بله می‌فرستد، و جواب ادمین را
// (Reply روی همان پیام در ربات) به‌صورت نوتیف اختصاصی و پیام داخل اپ به همان
// کاربر می‌رساند.
//
// تلگرام از سرور ایران فیلتر است، پس از outboundhttp (رله‌ی Cloudflare یا
// پراکسی) می‌رود؛ بله مستقیم. توکن‌ها و شناسه‌ی چت از تنظیمات پنل خوانده
// می‌شوند و تغییرشان بدون ری‌استارت اعمال می‌شود.
package adminbotservice

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	userdomain "shadowing-backend/internal/domain/user"
	"shadowing-backend/internal/pkg/adminnotice"
	"shadowing-backend/internal/pkg/outboundhttp"
	settingsservice "shadowing-backend/internal/service/settings"
)

type platform struct {
	name     string
	base     string
	tokenKey string
	chatKey  string
	client   func() (*http.Client, error)
}

var directClient = &http.Client{Timeout: 40 * time.Second}

var platforms = []platform{
	{
		name: "telegram", base: "https://api.telegram.org",
		tokenKey: settingsservice.KeyTelegramBotToken, chatKey: settingsservice.KeyTelegramChatID,
		client: func() (*http.Client, error) {
			c, err := outboundhttp.Client()
			if err != nil {
				return nil, err
			}
			// هر فراخوانی (حتی long-poll) سقف زمانی دارد.
			cp := *c
			cp.Timeout = 40 * time.Second
			return &cp, nil
		},
	},
	{
		name: "bale", base: "https://tapi.bale.ai",
		tokenKey: settingsservice.KeyBaleBotToken, chatKey: settingsservice.KeyBaleChatID,
		client: func() (*http.Client, error) { return directClient, nil },
	},
}

// UserLookup اسم و شماره‌ی کاربر را برای پیام ربات می‌دهد.
type UserLookup interface {
	GetUserByID(id string) (userdomain.User, error)
}

// Replier جواب ادمین را ذخیره و با نوتیف به کاربر می‌رساند (feedbackservice).
type Replier interface {
	Reply(ctx context.Context, kind, refID, userID, reply string) (pushed int, err error)
}

type Service struct {
	settings *settingsservice.Service
	users    UserLookup
	replier  Replier
}

func New(settings *settingsservice.Service, users UserLookup, replier Replier) *Service {
	return &Service{settings: settings, users: users, replier: replier}
}

func (s *Service) configured(p platform) (token, chat string, ok bool) {
	token = strings.TrimSpace(s.settings.Get(p.tokenKey))
	chat = strings.TrimSpace(s.settings.Get(p.chatKey))
	return token, chat, token != "" && chat != ""
}

// Notify خبر را در پس‌زمینه به همه‌ی ربات‌های تنظیم‌شده می‌فرستد.
func (s *Service) Notify(n adminnotice.Notice) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		text := s.format(n)
		for _, p := range platforms {
			token, chat, ok := s.configured(p)
			if !ok {
				continue
			}
			if err := s.send(ctx, p, token, chat, text, 0); err != nil {
				slog.Warn("adminbot: send failed", "platform", p.name, "kind", n.Kind, "error", err)
			}
		}
	}()
}

// Test یک پیام آزمایشی به هر ربات تنظیم‌شده می‌فرستد و نتیجه‌ی هر کدام را برمی‌گرداند.
func (s *Service) Test(ctx context.Context) map[string]string {
	out := map[string]string{}
	for _, p := range platforms {
		token, chat, ok := s.configured(p)
		if !ok {
			out[p.name] = "تنظیم نشده"
			continue
		}
		if err := s.send(ctx, p, token, chat, "✅ ربات LingoFlow وصل است. از این به بعد پیام‌های کاربرها اینجا می‌آید.", 0); err != nil {
			out[p.name] = "خطا: " + err.Error()
			continue
		}
		out[p.name] = "ارسال شد"
	}
	return out
}

func maskPhone(phone string) string {
	r := []rune(phone)
	if len(r) < 8 {
		return phone
	}
	return string(r[:4]) + "***" + string(r[len(r)-4:])
}

// format متن پیام ربات. خط آخر (ref) برای پیدا کردن کاربر هنگام جواب ادمین است.
func (s *Service) format(n adminnotice.Notice) string {
	var b strings.Builder
	b.WriteString(n.Section)
	b.WriteString("\n\n")
	b.WriteString(strings.TrimSpace(n.Body))
	b.WriteString("\n\n")
	if s.users != nil && n.UserID != "" {
		if u, err := s.users.GetUserByID(n.UserID); err == nil {
			name := strings.TrimSpace(u.NickName)
			if name == "" {
				name = "بدون نام"
			}
			b.WriteString("👤 " + name + " · " + maskPhone(u.Phone) + "\n")
		}
	}
	b.WriteString("🕐 " + time.Now().In(tehran).Format("2006-01-02 15:04") + "\n")
	b.WriteString(fmt.Sprintf("ref:%s:%s u:%s\n", n.Kind, n.RefID, n.UserID))
	b.WriteString("↩️ برای جواب دادن به کاربر، روی همین پیام Reply بزن.")
	return b.String()
}

var tehran = func() *time.Location {
	if loc, err := time.LoadLocation("Asia/Tehran"); err == nil {
		return loc
	}
	return time.FixedZone("IRST", 3*3600+1800)
}()

type apiResponse struct {
	OK          bool            `json:"ok"`
	Description string          `json:"description"`
	Result      json.RawMessage `json:"result"`
}

func (s *Service) call(ctx context.Context, p platform, token, method string, payload any) (json.RawMessage, error) {
	client, err := p.client()
	if err != nil {
		return nil, err
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.base+"/bot"+token+"/"+method, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		// متن خطا ممکن است آدرس (و توکن) را داشته باشد؛ فقط نوعش را برمی‌گردانیم.
		var ue interface{ Unwrap() error }
		if errors.As(err, &ue) && ue.Unwrap() != nil {
			return nil, fmt.Errorf("اتصال به %s ناموفق بود: %v", p.name, ue.Unwrap())
		}
		return nil, fmt.Errorf("اتصال به %s ناموفق بود", p.name)
	}
	defer resp.Body.Close()
	var r apiResponse
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return nil, fmt.Errorf("%s: پاسخ نامعتبر (HTTP %d)", p.name, resp.StatusCode)
	}
	if !r.OK {
		return nil, fmt.Errorf("%s: %s", p.name, r.Description)
	}
	return r.Result, nil
}

func chatValue(chat string) any {
	if id, err := strconv.ParseInt(chat, 10, 64); err == nil {
		return id
	}
	return chat
}

func (s *Service) send(ctx context.Context, p platform, token, chat, text string, replyTo int64) error {
	payload := map[string]any{"chat_id": chatValue(chat), "text": text}
	if replyTo != 0 {
		payload["reply_to_message_id"] = replyTo
	}
	_, err := s.call(ctx, p, token, "sendMessage", payload)
	return err
}

// ---------- دریافت جواب ادمین ----------

type update struct {
	UpdateID int64 `json:"update_id"`
	Message  *struct {
		MessageID int64 `json:"message_id"`
		Chat      struct {
			ID int64 `json:"id"`
		} `json:"chat"`
		Text           string `json:"text"`
		ReplyToMessage *struct {
			Text string `json:"text"`
		} `json:"reply_to_message"`
	} `json:"message"`
}

var refPattern = regexp.MustCompile(`ref:([a-z]+):([0-9a-fA-F-]*) u:([0-9a-fA-F-]{36})`)

// StartPolling برای هر ربات یک حلقه‌ی getUpdates اجرا می‌کند تا ctx لغو شود.
// تا وقتی توکن تنظیم نشده، فقط هر چند ثانیه تنظیمات را دوباره نگاه می‌کند.
func (s *Service) StartPolling(ctx context.Context) {
	for _, p := range platforms {
		go s.poll(ctx, p)
	}
}

func (s *Service) poll(ctx context.Context, p platform) {
	var offset int64
	for ctx.Err() == nil {
		token := strings.TrimSpace(s.settings.Get(p.tokenKey))
		if token == "" {
			sleep(ctx, 30*time.Second)
			continue
		}
		raw, err := s.call(ctx, p, token, "getUpdates", map[string]any{
			"offset": offset, "timeout": 25, "allowed_updates": []string{"message"},
		})
		if err != nil {
			slog.Debug("adminbot: getUpdates failed", "platform", p.name, "error", err)
			sleep(ctx, 15*time.Second)
			continue
		}
		var updates []update
		if err := json.Unmarshal(raw, &updates); err != nil {
			sleep(ctx, 15*time.Second)
			continue
		}
		for _, u := range updates {
			offset = u.UpdateID + 1
			s.handle(ctx, p, token, u)
		}
	}
}

func sleep(ctx context.Context, d time.Duration) {
	select {
	case <-ctx.Done():
	case <-time.After(d):
	}
}

func (s *Service) handle(ctx context.Context, p platform, token string, u update) {
	m := u.Message
	if m == nil || strings.TrimSpace(m.Text) == "" {
		return
	}
	chatID := strconv.FormatInt(m.Chat.ID, 10)
	text := strings.TrimSpace(m.Text)

	// /id شناسه‌ی همین چت را می‌دهد تا ادمین در پنل وارد کند.
	if text == "/start" || text == "/id" {
		_ = s.send(ctx, p, token, chatID, "شناسه‌ی این چت: "+chatID+"\nاین عدد را در پنل ادمین (تنظیمات ← ربات اعلان‌ها) وارد کن.", m.MessageID)
		return
	}
	// فقط از چتی که در پنل ثبت شده جواب قبول می‌شود.
	if chatID != strings.TrimSpace(s.settings.Get(p.chatKey)) {
		return
	}
	if m.ReplyToMessage == nil {
		_ = s.send(ctx, p, token, chatID, "برای جواب دادن به یک کاربر، روی پیام همان کاربر Reply بزن.", m.MessageID)
		return
	}
	match := refPattern.FindStringSubmatch(m.ReplyToMessage.Text)
	if match == nil {
		_ = s.send(ctx, p, token, chatID, "این پیام مال کاربری نیست؛ روی پیامی Reply بزن که خط ref دارد.", m.MessageID)
		return
	}
	if s.replier == nil {
		return
	}
	pushed, err := s.replier.Reply(ctx, match[1], match[2], match[3], text)
	if err != nil {
		_ = s.send(ctx, p, token, chatID, "❌ جواب ثبت نشد: "+err.Error(), m.MessageID)
		return
	}
	msg := "✅ جواب ثبت شد و در اپ کاربر نمایش داده می‌شود."
	if pushed > 0 {
		msg = "✅ جواب برای کاربر فرستاده شد (نوتیف + داخل اپ)."
	}
	_ = s.send(ctx, p, token, chatID, msg, m.MessageID)
}
