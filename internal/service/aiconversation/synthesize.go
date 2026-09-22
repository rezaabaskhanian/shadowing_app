package aiconversationservice

import "context"

// synthesize قبلاً پاسخِ AI را با ElevenLabs به صدا تبدیل می‌کرد. طبق تصمیمِ
// محصول، ElevenLabs فقط در پنل ادمین (صدای دیالوگ‌های صحنه) استفاده می‌شود؛
// AI Conversation دیگر صدا تولید نمی‌کند و همیشه رشته‌ی خالی برمی‌گرداند تا
// کاربر فقط پاسخ متنی را ببیند.
func (s *Service) synthesize(ctx context.Context, text string) string {
	return ""
}
