package upload

import (
	"context"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"

	"shadowing-backend/internal/pkg/filestore"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
)

var allowedImageExt = map[string]bool{
	".png":  true,
	".jpg":  true,
	".jpeg": true,
	".webp": true,
	".gif":  true,
}

const MaxImageSize = 10 << 20 // 10MB

// contentTypeByExt چون فایل مستقیم از multipart بایت خام خوانده می‌شود، نه
// از os.Create که content-type را حدس می‌زد؛ برای S3 لازم است صریح بدهیم.
var contentTypeByExt = map[string]string{
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".gif":  "image/gif",
}

// SaveImage یک فایل تصویر آپلودشده (multipart) را ذخیره می‌کند (روی دیسک یا
// object storage، بسته به store) و URL عمومی + نام فایل را برمی‌گرداند. بین
// آپلود ادمین و آپلود کاربر عادی (پیشنهاد صحنه) مشترک است تا منطق
// اعتبارسنجی/ذخیره تکرار نشود.
func SaveImage(ctx context.Context, fileHeader *multipart.FileHeader, store filestore.Store) (url, filename string, err error) {
	const op = "upload.SaveImage"

	if fileHeader.Size > MaxImageSize {
		return "", "", richerror.New(op).WithMessage("حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد")
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if !allowedImageExt[ext] {
		return "", "", richerror.New(op).WithMessage("فرمت تصویر مجاز نیست. مجاز: png, jpg, jpeg, webp, gif")
	}

	src, err := fileHeader.Open()
	if err != nil {
		return "", "", richerror.New(op).WithErr(err).WithMessage("خطا در خواندن فایل")
	}
	defer src.Close()

	data, err := io.ReadAll(src)
	if err != nil {
		return "", "", richerror.New(op).WithErr(err).WithMessage("خطا در خواندن فایل")
	}

	filename = uuid.NewString() + ext
	url, err = store.Save(ctx, filename, data, contentTypeByExt[ext])
	if err != nil {
		return "", "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره فایل")
	}
	return url, filename, nil
}
