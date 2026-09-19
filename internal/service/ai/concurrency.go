package aiservice

import (
	"context"
	"os"
	"strconv"
	"strings"
	"sync"
)

// defaultMaxConcurrentRequests سقفِ پیش‌فرضِ فراخوانیِ هم‌زمان به providerِ
// فعال (Claude/Gemini/DeepSeek) است. عمداً کوچک است: providerها خودشان
// rate-limit سختگیرانه دارند و روی یک VPS با رمِ کم، صد‌ها transcription/TTS/AI
// call هم‌زمان سرور را OOM می‌کند خیلی زودتر از اینکه provider جواب بدهد.
// با env var AI_MAX_CONCURRENT_REQUESTS قابل تنظیم است.
const defaultMaxConcurrentRequests = 8

var (
	concurrencyOnce sync.Once
	concurrencySem  chan struct{}
)

// concurrencyLimiter یک سمافورِ سراسری در سطحِ کل پروسه برمی‌گرداند، نه یک
// سمافورِ جدا برای هر Service. چون aiservice.New چند بار صدا زده می‌شود
// (assessment، aiconversation و freespeech هرکدام نمونه‌ی خودشان را می‌سازند؛
// نگاه کنید به cmd/main.go)، اگر سمافور روی خودِ Service بود، سقفِ واقعی چند
// برابر می‌شد. اینجا با sync.Once یک‌بار برای کل پروسه ساخته می‌شود.
func concurrencyLimiter() chan struct{} {
	concurrencyOnce.Do(func() {
		concurrencySem = make(chan struct{}, maxConcurrentRequestsFromEnv())
	})
	return concurrencySem
}

func maxConcurrentRequestsFromEnv() int {
	if v := strings.TrimSpace(os.Getenv("AI_MAX_CONCURRENT_REQUESTS")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n
		}
	}
	return defaultMaxConcurrentRequests
}

// withLimit فراخوانیِ fn را داخلِ سمافورِ سراسری اجرا می‌کند — اگر همه‌ی
// جای‌ها پر باشند صبر می‌کند تا یکی آزاد شود یا ctx لغو شود (نه اینکه
// درخواست‌های اضافی را رد کند؛ صف‌شدن روی یک عملیاتِ چند-ثانیه‌ای بهتر از
// رد کردنِ کاربر است).
func withLimit(ctx context.Context, fn func() error) error {
	sem := concurrencyLimiter()
	select {
	case sem <- struct{}{}:
	case <-ctx.Done():
		return ctx.Err()
	}
	defer func() { <-sem }()
	return fn()
}
