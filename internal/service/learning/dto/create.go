package dto

type CreateSceneRequest struct {
	Title              string    `json:"title" validate:"required"`
	Description        string    `json:"description"`
	BackgroundImageURL string    `json:"background_image_url" validate:"required,url"`
	Difficulty         string    `json:"difficulty" validate:"required,oneof=beginner intermediate advanced"`
	Hotspots           []Hotspot `json:"hotspots"`
	IsLocked           bool      `json:"is_locked"`
	Category           string    `json:"category"`
	// Order ترتیب این صحنه در مسیر آموزشی است (عدد کوچک‌تر = زودتر در مسیر).
	// در ساخت صحنه‌ی جدید اختیاری است (پیش‌فرض ۰)؛ ادمین از لیست صحنه‌ها
	// می‌تواند بعداً مرتب‌سازی کند.
	Order int `json:"order"`
}
