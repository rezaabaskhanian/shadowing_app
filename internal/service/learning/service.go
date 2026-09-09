package learningservice

import (
	"context"

	domain "shadowing-backend/internal/domain/learning/scene"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, scene domain.Scene) error
	GetByID(ctx context.Context, id string) (domain.Scene, error)
	GetAll(ctx context.Context) ([]domain.Scene, error)
	GetPublished(ctx context.Context) ([]domain.Scene, error)
	Update(ctx context.Context, scene domain.Scene) error
	Delete(ctx context.Context, id string) error
	GetCategories(ctx context.Context) ([]string, error)
	// UpdateDialogueWordTimings فقط ستون word_timings یک دیالوگ را به‌روز
	// می‌کند — برای پرکردن نتیجه‌ی تشخیص گفتار پس‌زمینه (به processWordTimingsAsync نگاه کنید).
	UpdateDialogueWordTimings(ctx context.Context, dialogueID string, timings []domain.WordTiming) error
	// UpdateOrder فقط ستون "order" (ترتیب مسیر آموزشی) یک صحنه را به‌روز
	// می‌کند — برای مرتب‌سازی سریع از لیست ادمین، بدون نیاز به ارسال کل
	// هات‌اسپات‌ها/دیالوگ‌ها.
	UpdateOrder(ctx context.Context, id string, order int) error
	// RandomDialogueTexts استخر متن انگلیسیِ دیالوگ‌های صحنه‌های دیگر را
	// برای گزینه‌های غلطِ کوئیز درک شنیداری برمی‌گرداند.
	RandomDialogueTexts(ctx context.Context, excludeSceneID string, difficulty string, limit int) ([]string, error)
	// GetDialogueByID یک دیالوگ را مستقیم می‌خواند — برای نمره‌دهیِ سمت
	// سرورِ کوئیز درک شنیداری (مقایسه‌ی پاسخ کاربر با متن واقعی).
	GetDialogueByID(ctx context.Context, id uuid.UUID) (domain.Dialogue, error)
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
