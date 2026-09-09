package progressservice

import "context"

// BreakStaleStreaks استریک کاربرانی که حداقل یک روز کامل بدون هیچ تمرینی
// گذشته را می‌شکند (Current صفر، وضعیت broken) و تعداد استریک‌های شکسته‌شده
// را برمی‌گرداند. از یک اجرای روزانه‌ی زمان‌بندی‌شده (cmd/main.go) صدا زده
// می‌شود؛ فراخوانی چندباره‌اش در یک روز بی‌خطر است چون فقط ردیف‌های واقعاً
// قدیمی را تغییر می‌دهد.
func (s *Service) BreakStaleStreaks(ctx context.Context) (int64, error) {
	return s.streakRepo.BreakStale(ctx)
}
