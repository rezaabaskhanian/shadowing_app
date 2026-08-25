package learningservice

import (
	"context"

	domain "shadowing-backend/internal/domain/learning/scene"
)

type Repository interface {
	Create(ctx context.Context, scene domain.Scene) error
	GetByID(ctx context.Context, id string) (domain.Scene, error)
	GetAll(ctx context.Context) ([]domain.Scene, error)
	GetPublished(ctx context.Context) ([]domain.Scene, error)
	Update(ctx context.Context, scene domain.Scene) error
	Delete(ctx context.Context, id string) error
	GetCategories(ctx context.Context) ([]string, error)
}

type Service struct {
	repo Repository
	// whisperURL آدرس سایدکار تشخیص گفتار برای زمان‌بندی کلمه‌به‌کلمه‌ی صدای
	// مرجع است؛ اگر خالی باشد، دیالوگ‌ها بدون word_timings ذخیره می‌شوند و
	// اپ فقط هایلایت کلمه‌به‌کلمه را نشان نمی‌دهد — مثل الگوی habitservice.
	whisperURL string
	// uploadDir مسیر دیسکِ فایل‌های صوتی آپلودشده (همان مسیری که آدرس عمومی
	// audio_url به آن اشاره می‌کند) — برای اینکه بتوانیم فایل را مستقیم به
	// whisper-service بدهیم.
	uploadDir string
}

func New(repo Repository, whisperURL, uploadDir string) Service {
	return Service{repo: repo, whisperURL: whisperURL, uploadDir: uploadDir}
}

/*

Publish Scene	انتشار سناریو (تغییر وضعیت به published)	پایین
Get Scene Progress	دریافت پیشرفت کاربر در یک سناریو	متوسط
Add Dialogue to Hotspot	اضافه کردن دیالوگ به هات‌اسپات	بالا
Reorder Hotspots	تغییر ترتیب هات‌اسپات‌ها	پایین

*/
