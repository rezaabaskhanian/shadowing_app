package dto

type Scene struct {
	ID                 string    `json:"id"` // SceneID as string
	Title              string    `json:"title"`
	Description        string    `json:"description"`
	BackgroundImageURL string    `json:"backgroundImageURL"`
	Difficulty         string    `json:"difficulty"`
	Status             string    `json:"status"`
	Hotspots           []Hotspot `json:"hotspots"`
	Order              int       `json:"order"`
	Category           string    `json:"category"`
	// IsLocked مقدار خام تنظیم‌شده توسط ادمین است. روت‌های ادمین همین مقدار
	// خام را برمی‌گردانند؛ روت‌های عمومی/موبایل (learninghandler) این فیلد
	// را بر اساس وضعیت اشتراک/نقش کاربر درخواست‌دهنده بازنویسی می‌کنند.
	IsLocked bool `json:"is_locked"`

	// Progress/IsCompleted هم مثل IsLocked توسط handler پر می‌شوند — پیشرفت
	// همان کاربر درخواست‌دهنده در این صحنه، نه چیزی که خودِ صحنه بداند.
	Progress    int  `json:"progress"`
	IsCompleted bool `json:"is_completed"`

	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}
