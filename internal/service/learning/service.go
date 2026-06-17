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
}

type Service struct {
	repo Repository
}

func New(repo Repository) Service {
	return Service{repo: repo}
}

/*

Publish Scene	انتشار سناریو (تغییر وضعیت به published)	پایین
Get Scene Progress	دریافت پیشرفت کاربر در یک سناریو	متوسط
Add Dialogue to Hotspot	اضافه کردن دیالوگ به هات‌اسپات	بالا
Reorder Hotspots	تغییر ترتیب هات‌اسپات‌ها	پایین

*/
