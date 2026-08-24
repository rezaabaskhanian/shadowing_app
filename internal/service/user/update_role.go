package userservice

import "context"

// UpdateRole نقش یک کاربر را تغییر می‌دهد (مثلاً ارتقا به «admin») — برای
// صفحه‌ی کاربران پنل ادمین.
func (s Service) UpdateRole(ctx context.Context, userID, role string) error {
	return s.repo.UpdateRole(ctx, userID, role)
}
