package assessment

// ScoreToLevel یک OverallScore میانگین (۰ تا ۱۰۰، خروجی speecheval) را به یک
// سطح شبیه CEFR نگاشت می‌کند. آستانه‌ها عمداً ساده‌اند و placeholder محسوب
// می‌شوند؛ با داده‌ی واقعی کاربران قابل تنظیم‌اند. هیچ‌جای دیگر کد به مقدار
// دقیق این آستانه‌ها وابسته نیست، فقط به لیست مرتب سطوح.
func ScoreToLevel(avgOverallScore float64) Level {
	switch {
	case avgOverallScore >= 90:
		return LevelC1
	case avgOverallScore >= 75:
		return LevelB2
	case avgOverallScore >= 60:
		return LevelB1
	case avgOverallScore >= 40:
		return LevelA2
	default:
		return LevelA1
	}
}
