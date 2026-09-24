package scence

// PreviewPerHigherLevel تعداد صحنه‌های اولِ هر سطحِ بالاتر از سطح کاربر که
// به‌عنوان پیش‌نمایش نشان داده می‌شوند؛ بقیه‌ی صحنه‌های آن سطح پنهان‌اند.
const PreviewPerHigherLevel = 2

var difficultyRank = map[DifficultyLevel]int{
	DifficultyBeginner:     0,
	DifficultyIntermediate: 1,
	DifficultyAdvanced:     2,
}

// FilterByLevel صحنه‌هایی را نگه می‌دارد که کاربری با سطح userLevel اجازه‌ی
// دیدنشان را دارد: همه‌ی صحنه‌های سطح خودش و سطوح پایین‌تر، و از هر سطح
// بالاتر فقط PreviewPerHigherLevel صحنه‌ی اول (به ترتیب ورودی). ورودی باید
// فقط صحنه‌های منتشرشده و مرتب بر اساس "order" باشد. برای اینکه هم handler
// (با dto) و هم سرویس ماموریت (با entity) از همین یک قانون استفاده کنند،
// generic است و سطح هر آیتم را با difficultyOf می‌خواند.
func FilterByLevel[T any](items []T, difficultyOf func(T) DifficultyLevel, userLevel DifficultyLevel) []T {
	userRank := difficultyRank[userLevel]
	previewed := map[DifficultyLevel]int{}
	visible := make([]T, 0, len(items))
	for _, it := range items {
		d := difficultyOf(it)
		rank, known := difficultyRank[d]
		if !known || rank <= userRank {
			visible = append(visible, it)
			continue
		}
		if previewed[d] < PreviewPerHigherLevel {
			previewed[d]++
			visible = append(visible, it)
		}
	}
	return visible
}
