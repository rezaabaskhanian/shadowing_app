package telegramchannel

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

	"shadowing-backend/internal/pkg/outboundhttp"
	settingsservice "shadowing-backend/internal/service/settings"
)

var tehranLocation = func() *time.Location {
	if loc, err := time.LoadLocation("Asia/Tehran"); err == nil {
		return loc
	}
	return time.FixedZone("IRST", 3*3600+1800)
}()

var htmlTagRegex = regexp.MustCompile(`<[^>]*>`)

type Service struct {
	settings *settingsservice.Service
}

func New(settings *settingsservice.Service) *Service {
	return &Service{
		settings: settings,
	}
}

func (s *Service) getClient() (*http.Client, error) {
	c, err := outboundhttp.Client()
	if err != nil {
		return nil, err
	}
	cp := *c
	cp.Timeout = 40 * time.Second
	return &cp, nil
}

// resolveBotToken توکن ربات کانال را پیدا می‌کند (ابتدا توکن اختصاصی کانال، اگر خالی بود توکن ربات اصلی ادمین).
func (s *Service) resolveBotToken() string {
	tok := strings.TrimSpace(s.settings.Get(settingsservice.KeyTelegramChannelBotToken))
	if tok != "" {
		return tok
	}
	return strings.TrimSpace(s.settings.Get(settingsservice.KeyTelegramBotToken))
}

// resolveChannelID شناسه‌ی کانال (مثلاً @lingoflow_app یا -100...) را برمی‌گرداند.
func (s *Service) resolveChannelID() string {
	return strings.TrimSpace(s.settings.Get(settingsservice.KeyTelegramChannelID))
}

type apiResponse struct {
	OK          bool            `json:"ok"`
	Description string          `json:"description"`
	ErrorCode   int             `json:"error_code"`
	Result      json.RawMessage `json:"result"`
}

func chatValue(chat string) any {
	if id, err := strconv.ParseInt(chat, 10, 64); err == nil {
		return id
	}
	return chat
}

func (s *Service) sendTelegramMessage(ctx context.Context, token, chatID, text string) error {
	// ابتدا پیام را با قالب استاندارد و ایمن HTML ارسال می‌کنیم
	err := s.executeTelegramSend(ctx, token, chatID, text, "HTML")
	if err == nil {
		return nil
	}

	// اگر تلگرام خطای تجزیه قالب داد، تگ‌های HTML را حذف و به صورت متن ساده ارسال می‌کنیم تا ارسال نسوزد
	errStr := strings.ToLower(err.Error())
	if strings.Contains(errStr, "can't parse entities") || strings.Contains(errStr, "parse entities") {
		slog.Warn("telegramchannel: html parse error, retrying as plain text", "err", err)
		plainText := htmlTagRegex.ReplaceAllString(text, "")
		return s.executeTelegramSend(ctx, token, chatID, plainText, "")
	}

	return err
}

func (s *Service) executeTelegramSend(ctx context.Context, token, chatID, text, parseMode string) error {
	client, err := s.getClient()
	if err != nil {
		return fmt.Errorf("خطا در ایجاد کلاینت اتصال به تلگرام: %w", err)
	}

	payload := map[string]any{
		"chat_id":                  chatValue(chatID),
		"text":                     text,
		"disable_web_page_preview": false,
	}
	if parseMode != "" {
		payload["parse_mode"] = parseMode
	}

	body, _ := json.Marshal(payload)
	reqURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", token)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		var ue interface{ Unwrap() error }
		if errors.As(err, &ue) && ue.Unwrap() != nil {
			return fmt.Errorf("اتصال به تلگرام ناموفق بود: %v", ue.Unwrap())
		}
		return fmt.Errorf("اتصال به تلگرام ناموفق بود (پراکسی/اینترنت را بررسی کنید)")
	}
	defer resp.Body.Close()

	var r apiResponse
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return fmt.Errorf("پاسخ نامعتبر از سرور تلگرام (کد وضعیت: %d)", resp.StatusCode)
	}

	if !r.OK {
		desc := r.Description
		if strings.Contains(desc, "chat not found") {
			return fmt.Errorf("کانال پیدا نشد. مطمئن شوید آیدی کانال درست است و ربات در کانال عضو شده است (خطای تلگرام: %s)", desc)
		}
		if strings.Contains(desc, "not enough rights") || strings.Contains(desc, "need administrator rights") {
			return fmt.Errorf("ربات دسترسی ارسال پیام ندارد. لطفاً ربات را به عنوان ادمین (Administrator) با دسترسی Post Messages به کانال اضافه کنید (خطای تلگرام: %s)", desc)
		}
		if strings.Contains(desc, "Unauthorized") {
			return fmt.Errorf("توکن ربات تلگرام نامعتبر است (خطای تلگرام: %s)", desc)
		}
		return fmt.Errorf("تلگرام خطا برگرداند: %s", desc)
	}

	return nil
}

// GenerateTodayPost متن پست امروز را بر اساس حالت تنظیم‌شده تولید می‌کند
func (s *Service) GenerateTodayPost() string {
	mode := strings.TrimSpace(s.settings.Get(settingsservice.KeyTelegramChannelPostMode))
	customText := strings.TrimSpace(s.settings.Get(settingsservice.KeyTelegramChannelCustomText))

	if mode == "custom" && customText != "" {
		return customText
	}

	now := time.Now().In(tehranLocation)
	lesson := GetLessonForToday(now)
	channelID := s.resolveChannelID()
	return FormatTelegramMessageHTML(lesson, channelID, "https://lingoflow.ir")
}

// SendTest یک پیام آزمایشی به کانال می‌فرستد تا ادمین از اتصال و دسترسی مطمئن شود
func (s *Service) SendTest(ctx context.Context) error {
	token := s.resolveBotToken()
	if token == "" {
		return fmt.Errorf("توکن ربات تلگرام تنظیم نشده است")
	}
	channelID := s.resolveChannelID()
	if channelID == "" {
		return fmt.Errorf("آیدی کانال تلگرام تنظیم نشده است (مثلاً @lingoflow_english)")
	}

	now := time.Now().In(tehranLocation).Format("2006-01-02 15:04:05")
	testMsg := fmt.Sprintf("✅ <b>تست اتصال به کانال تلگرام LingoFlow</b>\n\nارتباط ربات با کانال با موفقیت برقرار است.\nزمان ارسال: <code>%s</code>\n\nاین یک پیام آزمایشی از پنل ادمین لینگوفلو است.", now)

	return s.sendTelegramMessage(ctx, token, channelID, testMsg)
}

// SendDailyPost پست روزانه را تولید و به کانال ارسال می‌کند
func (s *Service) SendDailyPost(ctx context.Context) error {
	token := s.resolveBotToken()
	if token == "" {
		return fmt.Errorf("توکن ربات تلگرام تنظیم نشده است")
	}
	channelID := s.resolveChannelID()
	if channelID == "" {
		return fmt.Errorf("آیدی کانال تلگرام تنظیم نشده است")
	}

	text := s.GenerateTodayPost()
	err := s.sendTelegramMessage(ctx, token, channelID, text)

	nowTehran := time.Now().In(tehranLocation)
	todayStr := nowTehran.Format("2006-01-02")
	timeStr := nowTehran.Format("15:04")

	if err != nil {
		status := fmt.Sprintf("❌ خطا در ارسال (%s %s): %s", todayStr, timeStr, err.Error())
		_ = s.settings.Set(ctx, settingsservice.KeyTelegramChannelLastStatus, status)
		return err
	}

	_ = s.settings.Set(ctx, settingsservice.KeyTelegramChannelLastDate, todayStr)
	status := fmt.Sprintf("✅ ارسال موفق در تاریخ %s ساعت %s", todayStr, timeStr)
	_ = s.settings.Set(ctx, settingsservice.KeyTelegramChannelLastStatus, status)
	return nil
}

// SendNow اجازه می‌دهد ادمین همین الان پستی ارسال کند (یا با متن دلخواه یک‌باره)
func (s *Service) SendNow(ctx context.Context, customText string) error {
	token := s.resolveBotToken()
	if token == "" {
		return fmt.Errorf("توکن ربات تلگرام تنظیم نشده است")
	}
	channelID := s.resolveChannelID()
	if channelID == "" {
		return fmt.Errorf("آیدی کانال تلگرام تنظیم نشده است")
	}

	var text string
	if strings.TrimSpace(customText) != "" {
		text = customText
	} else {
		text = s.GenerateTodayPost()
	}

	err := s.sendTelegramMessage(ctx, token, channelID, text)

	nowTehran := time.Now().In(tehranLocation)
	todayStr := nowTehran.Format("2006-01-02")
	timeStr := nowTehran.Format("15:04")

	if err != nil {
		status := fmt.Sprintf("❌ خطا در ارسال دستی (%s %s): %s", todayStr, timeStr, err.Error())
		_ = s.settings.Set(ctx, settingsservice.KeyTelegramChannelLastStatus, status)
		return err
	}

	status := fmt.Sprintf("✅ ارسال فوری موفق در %s ساعت %s", todayStr, timeStr)
	_ = s.settings.Set(ctx, settingsservice.KeyTelegramChannelLastStatus, status)
	return nil
}

// StartScheduler زمان‌بند پس‌زمینه که هر ۴۰ ثانیه زمان را در تهران چک می‌کند
func (s *Service) StartScheduler(ctx context.Context) {
	ticker := time.NewTicker(40 * time.Second)
	defer ticker.Stop()

	slog.Info("telegramchannel: scheduler started")

	for {
		select {
		case <-ctx.Done():
			slog.Info("telegramchannel: scheduler stopped")
			return
		case <-ticker.C:
			s.checkAndPost(ctx)
		}
	}
}

func (s *Service) checkAndPost(ctx context.Context) {
	enabled := strings.ToLower(strings.TrimSpace(s.settings.Get(settingsservice.KeyTelegramChannelEnabled)))
	if enabled != "true" && enabled != "1" {
		return
	}

	channelID := s.resolveChannelID()
	token := s.resolveBotToken()
	if channelID == "" || token == "" {
		return
	}

	postTime := strings.TrimSpace(s.settings.Get(settingsservice.KeyTelegramChannelPostTime))
	if postTime == "" {
		postTime = "08:30" // پیش‌فرض ساعت ۸:۳۰ صبح به وقت تهران
	}

	now := time.Now().In(tehranLocation)
	currentTime := now.Format("15:04")
	todayDate := now.Format("2006-01-02")

	if currentTime != postTime {
		return
	}

	lastSentDate := strings.TrimSpace(s.settings.Get(settingsservice.KeyTelegramChannelLastDate))
	if lastSentDate == todayDate {
		// امروز قبلاً راس همین ساعت ارسال شده است
		return
	}

	slog.Info("telegramchannel: triggered daily post", "time", currentTime, "date", todayDate, "channel", channelID)

	callCtx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	if err := s.SendDailyPost(callCtx); err != nil {
		slog.Error("telegramchannel: daily post failed", "error", err)
	} else {
		slog.Info("telegramchannel: daily post sent successfully", "channel", channelID)
	}
}
