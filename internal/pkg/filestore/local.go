package filestore

import (
	"context"
	"os"
	"path/filepath"
	"strings"

	"shadowing-backend/internal/pkg/richerror"
)

// localStore رفتارِ قبلیِ پروژه است: نوشتن روی دیسکِ محلی، سرو با
// echo.Static از همان مسیر (نگاه کنید به server.go). فقط برای تک-instance
// درست کار می‌کند.
type localStore struct {
	dir        string
	publicPath string
}

func newLocalStore(dir, publicPath string) *localStore {
	return &localStore{dir: dir, publicPath: publicPath}
}

// Save؛ filename می‌تواند شاملِ زیرپوشه هم باشد (مثلاً "ai-conversation/x.mp3")
// — دقیقاً مثلِ object key در S3، پس زیرپوشه‌ی مقصد را هم می‌سازیم.
func (l *localStore) Save(_ context.Context, filename string, data []byte, _ string) (string, error) {
	const op = "filestore.localStore.Save"

	fullPath := filepath.Join(l.dir, filename)
	if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در آماده‌سازی محل ذخیره‌سازی")
	}
	if err := os.WriteFile(fullPath, data, 0o644); err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در نوشتن فایل")
	}
	return strings.TrimRight(l.publicPath, "/") + "/" + filename, nil
}

func (l *localStore) Open(_ context.Context, filename string) (string, func(), error) {
	return filepath.Join(l.dir, filename), func() {}, nil
}
