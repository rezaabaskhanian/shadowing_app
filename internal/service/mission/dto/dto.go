package dto

// TodaysMissionResponse صحنه‌ی پیشنهادیِ امروز را همراه با متادیتای نمایشی
// (نه محتوای جدید) برمی‌گرداند — موبایل خودِ صحنه را از روی scene_id از
// لیست صحنه‌های از قبل بارگذاری‌شده پیدا می‌کند (تصویر/عنوان از همان‌جا).
type TodaysMissionResponse struct {
	SceneID string `json:"scene_id"`
	Title   string `json:"title"`
	// Category دسته‌ی صحنه (مثل "cafe") برای برچسب کوچک روی کارت.
	Category string `json:"category"`
	// Difficulty سطح دشواریِ خودِ صحنه (beginner/intermediate/advanced).
	Difficulty string `json:"difficulty"`
	// Level برچسبِ سطح برای نمایش: اگر کاربر پروفایل گفتاری دارد یک سطح
	// CEFR واقعی (مثل "B1") است؛ اگر نه، همان Difficulty با حرف بزرگ (مثل
	// "Beginner") — تا هیچ‌وقت یک سطح CEFR جعلی نشان داده نشود.
	Level string `json:"level"`
	// IsEstimatedLevel یعنی کاربر هنوز تست تعیین سطح را نداده و این فقط
	// یک پیش‌فرض است، نه سطح واقعیِ اندازه‌گیری‌شده.
	IsEstimatedLevel bool `json:"is_estimated_level"`
	// FocusSkill یکی از "pronunciation" / "fluency" / "speaking" (عمومی،
	// وقتی هنوز داده‌ای برای تشخیص مهارتِ ضعیف‌تر وجود ندارد).
	FocusSkill       string `json:"focus_skill"`
	EstimatedMinutes int    `json:"estimated_minutes"`
}
