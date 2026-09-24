package dto

type CreateSceneRequest struct {
	Title              string    `json:"title" validate:"required"`
	Description        string    `json:"description"`
	BackgroundImageURL string    `json:"background_image_url" validate:"required,url"`
	Difficulty         string    `json:"difficulty" validate:"required,oneof=beginner intermediate advanced"`
	Hotspots           []Hotspot `json:"hotspots"`
	IsLocked           bool      `json:"is_locked"`
	// IsPublished تعیین می‌کند صحنه در اپ نمایش داده شود (published) یا فقط
	// پیش‌نویس بماند (draft) و فقط ادمین آن را ببیند.
	IsPublished bool   `json:"is_published"`
	Category    string `json:"category"`
	// نکته‌ی گرامریِ اختیاری (موضوع، توضیح فارسی، ۲ تا ۴ مثال).
	GrammarTopic       string           `json:"grammar_topic"`
	GrammarExplanation string           `json:"grammar_explanation"`
	GrammarExamples    []GrammarExample `json:"grammar_examples"`
	// GrammarAudioURL صدای تولیدشده (ElevenLabs) برای GrammarExplanation است؛
	// از پنل ادمین با همان generate-audio دیالوگ‌ها ساخته و اینجا فرستاده می‌شود.
	GrammarAudioURL string `json:"grammar_audio_url"`
	// LevelPosition جایگاه این صحنه در مسیرِ سطح خودش است (همان شماره‌ای که
	// پنل ادمین کنار هر صحنه نشان می‌دهد؛ فقط صحنه‌های منتشرشده‌ی همان سطح
	// شمرده می‌شوند). اختیاری: ۰ = در ساخت، آخر مسیر؛ در ویرایش، حفظ ترتیب
	// فعلی. عدد مثبت = درج در همان جایگاه (صحنه‌های بعدی یکی عقب می‌روند).
	LevelPosition int `json:"level_position"`
}
