// Package filestore محلِ ذخیره‌ی فایل‌های عمومی/دائمی (صدای TTS، تصویر صحنه،
// صدای آپلودیِ ادمین) را از منطقِ بقیه‌ی برنامه جدا می‌کند. با یک instanceِ
// تکی، نوشتن روی دیسکِ محلی کافی است؛ ولی به‌محضِ اینکه چند instanceِ backend
// پشتِ یک لودبالانسر اجرا شوند، فایلی که instance A نوشته باید توسطِ درخواستی
// که به instance B می‌خورد هم قابل‌خواندن باشد — دیسکِ محلی این را تضمین
// نمی‌کند. Store این تفاوت را پشتِ یک اینترفیس پنهان می‌کند.
package filestore

import (
	"context"
	"os"
	"strconv"
	"strings"
)

// Store انتزاعِ ذخیره‌سازیِ فایل. دو پیاده‌سازی دارد: دیسکِ محلی (پیش‌فرض،
// فقط برای تک-instance درست کار می‌کند) و object storage سازگار با S3
// (Arvan/Liara/MinIO/AWS — برای چند instance لازم است).
type Store interface {
	// Save داده را با نامِ filename ذخیره می‌کند و URL عمومیِ قابل‌سرو را برمی‌گرداند.
	Save(ctx context.Context, filename string, data []byte, contentType string) (url string, err error)

	// Open محتوای فایلی که قبلاً با همین filename ذخیره شده را در یک مسیرِ
	// دیسکِ محلی در دسترس می‌گذارد — برای کدهایی که فقط مسیرِ دیسک می‌پذیرند
	// (مثلاً whisper client). صدازننده باید cleanup() را بعدِ استفاده صدا بزند
	// (روی دیسکِ محلی noop است؛ روی S3 یک فایلِ موقتِ دانلودشده را پاک می‌کند).
	Open(ctx context.Context, filename string) (localPath string, cleanup func(), err error)
}

// New یک Store برمی‌گرداند. دقیقاً هم‌الگوی WHISPER_URL/CAFEBAZAAR_* پروژه:
// اگر OBJECT_STORAGE_ENDPOINT/BUCKET/ACCESS_KEY/SECRET_KEY همه ست باشند،
// object storage فعال می‌شود؛ وگرنه بدون خطا به دیسکِ محلی fallback می‌شود —
// اپ روی تک-instance دقیقاً مثلِ قبل کار می‌کند.
func New(localDir, localPublicPath string) (Store, error) {
	endpoint := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_ENDPOINT"))
	bucket := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_BUCKET"))
	accessKey := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_ACCESS_KEY"))
	secretKey := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_SECRET_KEY"))
	if endpoint == "" || bucket == "" || accessKey == "" || secretKey == "" {
		return newLocalStore(localDir, localPublicPath), nil
	}

	publicBaseURL := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_PUBLIC_BASE_URL"))
	useSSL := true
	if v := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_USE_SSL")); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			useSSL = b
		}
	}
	if publicBaseURL == "" {
		scheme := "http"
		if useSSL {
			scheme = "https"
		}
		publicBaseURL = scheme + "://" + endpoint + "/" + bucket
	}

	return newS3Store(s3Config{
		endpoint:      endpoint,
		bucket:        bucket,
		accessKey:     accessKey,
		secretKey:     secretKey,
		publicBaseURL: publicBaseURL,
		useSSL:        useSSL,
	})
}
