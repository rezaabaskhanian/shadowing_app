// Package aiaccessservice کنترل دسترسی به فیچرهای گران (AI Conversation، Free
// Speech) را متمرکز می‌کند: دو شرط، هر دو قبل از هر فراخوانیِ AI چک می‌شوند —
// (۱) کاربر اشتراکِ فعال دارد، (۲) از سقفِ توکنِ روزانه‌اش رد نشده. این سقف
// عمداً سخاوتمندانه و ثابت برای همه‌ی کاربرهای مشترک است (نه بر اساسِ نوعِ
// پلن): هدف جلوگیری از یک کاربرِ پرمصرفِ غیرعادی (باگ کلاینت یا سوءاستفاده)
// است، نه سهمیه‌بندیِ دقیقِ اقتصادی. علاوه بر این، هزینه‌ی دلاریِ واقعیِ مصرف
// (pricing.go) هم حساب می‌شود تا قیمت‌گذاریِ اشتراک/تاپ‌آپ بر اساسِ عدد واقعی
// باشد، نه حدس.
package aiaccessservice

import (
	"context"
	"log/slog"
	"strconv"
	"strings"
	"time"

	"shadowing-backend/internal/pkg/richerror"
	postgresaiaccess "shadowing-backend/internal/repository/postgres/aiaccess"
	settingsservice "shadowing-backend/internal/service/settings"
)

// defaultDailyTokenLimit وقتی از پنل ادمین (AI_DAILY_TOKEN_LIMIT) چیزی تنظیم
// نشده استفاده می‌شود. تخمین: هر turnِ AI Conversation با تاریخچه‌ی رشدیابنده
// چیزی حدودِ چندصد تا چندهزار توکن می‌خورد؛ این عدد چند مکالمه‌ی کاملِ روزانه
// را برای یک کاربرِ عادی راحت پوشش می‌دهد.
const defaultDailyTokenLimit = 100_000

// EstimatedFlatCallInputTokens/OutputTokens برای فراخوانی‌هایی که هنوز توکنِ
// واقعی برنمی‌گردانند (GrammarResult/RelevanceResult، در هیچ‌کدام از ۴
// providerها) به‌جای نادیده‌گرفتنِ کاملِ مصرفشان استفاده می‌شود. چون سقفِ
// روزانه محافظتی است نه دقیقِ اقتصادی، یک تخمینِ محافظه‌کارانه کافی است —
// اضافه‌کردنِ Usage واقعی به آن دو تایپ در هر ۴ provider هزینه‌ی تغییرِ خیلی
// بیشتری داشت. نسبتِ ورودی/خروجی هم تخمینی است (پرامپت + رونوشتِ کوتاه در
// برابرِ یک جوابِ کوتاه‌تر).
const (
	EstimatedFlatCallInputTokens  = 300
	EstimatedFlatCallOutputTokens = 100
)

// SubscriptionChecker همان subscriptionservice.Service.HasActiveSubscription
// است؛ اینترفیسِ جدا تا این پکیج به کلِ subscriptionservice وابسته نشود.
type SubscriptionChecker interface {
	HasActiveSubscription(ctx context.Context, userID string) (bool, error)
}

// UsageRepository مصرفِ روزانه‌ی توکنِ هر کاربر را نگه می‌دارد (جدولِ
// ai_daily_usage، پیاده‌سازی در internal/repository/postgres/aiaccess).
type UsageRepository interface {
	AddAndGetTotal(ctx context.Context, userID string, day time.Time, inputTokens, outputTokens int) (int, error)
	GetUsage(ctx context.Context, userID string, day time.Time) (inputTokens, outputTokens int, err error)
	Stats(ctx context.Context, days int) (postgresaiaccess.UsageStats, error)
	GetCredit(ctx context.Context, userID string) (int, error)
	AddCredit(ctx context.Context, userID string, tokens int) (int, error)
	DecrementCredit(ctx context.Context, userID string, tokens int) error
}

type Service struct {
	subs     SubscriptionChecker
	usage    UsageRepository
	settings *settingsservice.Service
}

func New(subs SubscriptionChecker, usage UsageRepository, settings *settingsservice.Service) *Service {
	return &Service{subs: subs, usage: usage, settings: settings}
}

func (s *Service) dailyLimit() int {
	if v := strings.TrimSpace(s.settings.Get(settingsservice.KeyAIDailyTokenLimit)); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n
		}
	}
	return defaultDailyTokenLimit
}

func today() time.Time {
	return time.Now().UTC().Truncate(24 * time.Hour)
}

// CheckAllowed مشخص می‌کند کاربر همین الان اجازه‌ی یک فراخوانیِ تازه‌ی AI
// Conversation/Free Speech را دارد یا نه: اشتراکِ فعال اجباری است؛ بعد از آن،
// یا باید زیرِ سقفِ رایگانِ روزانه باشد یا اعتبارِ توکنِ خریداری‌شده
// (ai_token_credits، از تاپ‌آپِ کافه‌بازاری) داشته باشد — نگاه کنید به
// internal/service/tokentopup. خطای برگشتی همیشه KindForbidden است (برای
// بدون‌اشتراک یا پرشده‌ی سقف+اعتبار)، جز خطای واقعیِ زیرساختی که
// KindUnexpected می‌ماند — errorhandling.ErrorHandling این دو را به ۴۰۳ در
// برابرِ ۵۰۰ تبدیل می‌کند.
func (s *Service) CheckAllowed(ctx context.Context, op richerror.Op, userID string) error {
	active, err := s.subs.HasActiveSubscription(ctx, userID)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در بررسی اشتراک")
	}
	if !active {
		return richerror.New(op).WithKind(richerror.KindForbidden).
			WithMessage("این قابلیت فقط برای کاربران با اشتراک فعال در دسترس است")
	}

	input, output, err := s.usage.GetUsage(ctx, userID, today())
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در بررسی سقف مصرف روزانه")
	}
	if input+output < s.dailyLimit() {
		return nil
	}

	credit, err := s.usage.GetCredit(ctx, userID)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در بررسی اعتبار توکن")
	}
	if credit <= 0 {
		return richerror.New(op).WithKind(richerror.KindForbidden).
			WithMessage("سقف مصرف امروزِ این قابلیت تمام شده؛ فردا دوباره در دسترس است یا از داخل اپ توکن اضافه بخر")
	}
	return nil
}

// RecordUsage توکنِ مصرف‌شده‌ی یک فراخوانیِ موفق را به مجموعِ امروزِ کاربر
// اضافه می‌کند. عمداً خطا برنمی‌گرداند: یک شکستِ ثبتِ مصرف نباید جوابِ موفقِ
// AI که کاربر گرفته را خراب کند؛ فقط لاگ می‌شود، مثلِ یک متریکِ best-effort.
//
// اگر این تماس بعد از رد شدن از سقفِ رایگانِ روزانه اتفاق افتاده باشد (یعنی
// CheckAllowed آن را فقط به‌خاطرِ اعتبارِ خریداری‌شده اجازه داده)، همان مقدار
// از اعتبار کم می‌شود. تفکیکِ دقیق‌تر (اینکه مثلاً نصفِ یک تماس از سهمیه‌ی
// رایگان و نصفش از اعتبار باشد) عمداً انجام نشده — برای این سطح از دقتِ
// محافظتی/تجاری لازم نیست.
func (s *Service) RecordUsage(ctx context.Context, userID string, inputTokens, outputTokens int) {
	total := inputTokens + outputTokens
	if total <= 0 {
		return
	}

	beforeInput, beforeOutput, err := s.usage.GetUsage(ctx, userID, today())
	if err != nil {
		slog.Warn("aiaccess: failed to read usage before recording", "user_id", userID, "err", err)
	}
	wasOverDailyLimit := err == nil && beforeInput+beforeOutput >= s.dailyLimit()

	if _, err := s.usage.AddAndGetTotal(ctx, userID, today(), inputTokens, outputTokens); err != nil {
		slog.Warn("aiaccess: failed to record usage", "user_id", userID, "err", err)
		return
	}

	if wasOverDailyLimit {
		if err := s.usage.DecrementCredit(ctx, userID, total); err != nil {
			slog.Warn("aiaccess: failed to decrement token credit", "user_id", userID, "err", err)
		}
	}
}

// AddCredit اعتبارِ توکنِ کاربر را بعد از یک خریدِ تاییدشده‌ی تاپ‌آپ بالا
// می‌برد (نگاه کنید به tokentopupservice.VerifyAndGrant).
func (s *Service) AddCredit(ctx context.Context, userID string, tokens int) error {
	if tokens <= 0 {
		return nil
	}
	_, err := s.usage.AddCredit(ctx, userID, tokens)
	return err
}

// UsageStatus - جوابِ endpointِ کاربرمحورِ «مصرف امروز من» (نمایش نوار
// مصرف/پیشنهاد خرید توکن در اپ).
type UsageStatus struct {
	HasActiveSubscription bool `json:"has_active_subscription"`
	UsedTokens            int  `json:"used_tokens"`
	DailyLimit            int  `json:"daily_limit"`
	RemainingTokens       int  `json:"remaining_tokens"`
	// CreditBalance اعتبارِ توکنِ خریداری‌شده (تاپ‌آپ) است که وقتی سقفِ رایگانِ
	// روزانه تمام شد مصرف می‌شود؛ برخلافِ RemainingTokens هرگز خودکار صفر نمی‌شود.
	CreditBalance    int     `json:"credit_balance"`
	EstimatedCostUSD float64 `json:"estimated_cost_usd"`
}

// Status مصرفِ امروزِ کاربر را برمی‌گرداند — برای نمایش «امروز X از Y توکن
// استفاده کردی» توی اپ. کاربرِ بدون اشتراک هم می‌تواند این را بخواند (فقط
// HasActiveSubscription=false برمی‌گردد، خطا نه)، تا اپ بتواند پیامِ درست
// («برای استفاده مشترک شو») را نشان بدهد.
func (s *Service) Status(ctx context.Context, userID string) (UsageStatus, error) {
	const op = "aiaccess.Status"

	active, err := s.subs.HasActiveSubscription(ctx, userID)
	if err != nil {
		return UsageStatus{}, richerror.New(op).WithErr(err).WithMessage("خطا در بررسی اشتراک")
	}

	input, output, err := s.usage.GetUsage(ctx, userID, today())
	if err != nil {
		return UsageStatus{}, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن مصرف امروز")
	}

	used := input + output
	limit := s.dailyLimit()
	remaining := limit - used
	if remaining < 0 {
		remaining = 0
	}

	credit, err := s.usage.GetCredit(ctx, userID)
	if err != nil {
		return UsageStatus{}, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن اعتبار توکن")
	}

	return UsageStatus{
		HasActiveSubscription: active,
		UsedTokens:            used,
		DailyLimit:            limit,
		RemainingTokens:       remaining,
		CreditBalance:         credit,
		EstimatedCostUSD:      s.costUSD(input, output),
	}, nil
}

// UsageReport - جوابِ endpointِ ادمینِ «هزینه‌ی واقعیِ AI» (عیناً هم‌الگوی
// postgressubscription.RevenueStats، برای هم‌نشینیِ راحت با آن توی پنل ادمین).
type UsageReport struct {
	TotalCostUSD  float64                       `json:"total_cost_usd"`
	PeriodCostUSD float64                       `json:"period_cost_usd"`
	PeriodDays    int                           `json:"period_days"`
	Daily         []postgresaiaccess.DailyUsage `json:"daily"`
	DailyCostUSD  []float64                     `json:"daily_cost_usd"`
}

// Report هزینه‌ی دلاریِ واقعیِ مصرفِ AI را برای بازه‌ی داده‌شده حساب می‌کند
// (بر اساسِ AI_TOKEN_PRICING فعلی — نگاه کنید به pricing.go برای محدودیت‌های
// این تخمین).
func (s *Service) Report(ctx context.Context, days int) (UsageReport, error) {
	const op = "aiaccess.Report"

	stats, err := s.usage.Stats(ctx, days)
	if err != nil {
		return UsageReport{}, richerror.New(op).WithErr(err)
	}

	// اسلایسِ nil در JSON می‌شود null و فرانت روی .length می‌ترکد؛ همیشه [] بده.
	if stats.Daily == nil {
		stats.Daily = []postgresaiaccess.DailyUsage{}
	}

	report := UsageReport{
		TotalCostUSD:  s.costUSD(stats.TotalInputTokens, stats.TotalOutputTokens),
		PeriodCostUSD: s.costUSD(stats.PeriodInputTokens, stats.PeriodOutputTokens),
		PeriodDays:    days,
		Daily:         stats.Daily,
		DailyCostUSD:  make([]float64, len(stats.Daily)),
	}
	for i, d := range stats.Daily {
		report.DailyCostUSD[i] = s.costUSD(d.InputTokens, d.OutputTokens)
	}
	return report, nil
}
