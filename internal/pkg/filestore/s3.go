package filestore

import (
	"bytes"
	"context"
	"io"
	"os"
	"path/filepath"
	"strings"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// s3Store یک object storage سازگار با S3 (Arvan/Liara/MinIO/AWS) است — برای
// اینکه فایلی که یک instanceِ backend نوشته، با instanceِ دیگری هم که بعداً
// درخواستِ خواندنش بیاید در دسترس باشد (پیش‌نیازِ اجباریِ چند-instance).
type s3Store struct {
	client     *minio.Client
	bucket     string
	publicBase string
}

type s3Config struct {
	endpoint      string
	bucket        string
	accessKey     string
	secretKey     string
	publicBaseURL string
	useSSL        bool
}

func newS3Store(cfg s3Config) (*s3Store, error) {
	const op = "filestore.newS3Store"

	client, err := minio.New(cfg.endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.accessKey, cfg.secretKey, ""),
		Secure: cfg.useSSL,
	})
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت کلاینت object storage")
	}

	return &s3Store{
		client:     client,
		bucket:     cfg.bucket,
		publicBase: strings.TrimRight(cfg.publicBaseURL, "/"),
	}, nil
}

func (s *s3Store) Save(ctx context.Context, filename string, data []byte, contentType string) (string, error) {
	const op = "filestore.s3Store.Save"

	_, err := s.client.PutObject(ctx, s.bucket, filename, bytes.NewReader(data), int64(len(data)),
		minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در آپلود فایل به object storage")
	}
	return s.publicBase + "/" + filename, nil
}

func (s *s3Store) Open(ctx context.Context, filename string) (string, func(), error) {
	const op = "filestore.s3Store.Open"

	obj, err := s.client.GetObject(ctx, s.bucket, filename, minio.GetObjectOptions{})
	if err != nil {
		return "", nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن فایل از object storage")
	}
	defer obj.Close()

	tmp, err := os.CreateTemp("", "filestore-*-"+filepath.Base(filename))
	if err != nil {
		return "", nil, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت فایل موقت")
	}
	cleanup := func() { os.Remove(tmp.Name()) }

	if _, err := io.Copy(tmp, obj); err != nil {
		tmp.Close()
		cleanup()
		return "", nil, richerror.New(op).WithErr(err).WithMessage("خطا در دانلود فایل از object storage")
	}
	if err := tmp.Close(); err != nil {
		cleanup()
		return "", nil, richerror.New(op).WithErr(err).WithMessage("خطا در بستن فایل موقت")
	}

	return tmp.Name(), cleanup, nil
}
