package dto

// QuizQuestion یک سوال چهارگزینه‌ای درک شنیداری است که کاملاً از روی
// دیالوگ‌های واقعیِ همین صحنه (و صحنه‌های دیگر برای گزینه‌های غلط) ساخته
// می‌شود — محتوای دستی جداگانه لازم ندارد، پس با هر صحنه‌ی جدیدی که ادمین
// می‌سازد خودکار کار می‌کند.
type QuizQuestion struct {
	DialogueID string `json:"dialogue_id"`
	// Prompt ترجمه‌ی فارسیِ همان جمله است؛ کاربر باید جمله‌ی انگلیسیِ
	// درست را از بین گزینه‌ها تشخیص بدهد.
	Prompt  string   `json:"prompt"`
	Options []string `json:"options"`
}

type QuizAnswer struct {
	DialogueID   string `json:"dialogue_id"`
	SelectedText string `json:"selected_text"`
}

type QuizSubmitRequest struct {
	Answers []QuizAnswer `json:"answers"`
}

type QuizResult struct {
	Correct   int `json:"correct"`
	Total     int `json:"total"`
	XPAwarded int `json:"xp_awarded"`
}
