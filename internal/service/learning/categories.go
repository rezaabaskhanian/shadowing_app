package learningservice

import "context"

// ListCategories دسته‌بندی‌های متمایز و غیرخالیِ صحنه‌ها را برمی‌گرداند —
// برای پیشنهاد در فرم ساخت/ویرایش صحنه‌ی پنل ادمین.
func (s Service) ListCategories(ctx context.Context) ([]string, error) {
	return s.repo.GetCategories(ctx)
}
