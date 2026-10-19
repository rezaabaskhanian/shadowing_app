package learningservice

import (
	"context"
	"shadowing-backend/internal/pkg/richerror"
)

// UpdateSceneOrder فقط ترتیب یک صحنه در مسیر آموزشی را تغییر می‌دهد.
func (s Service) UpdateSceneOrder(ctx context.Context, id string, order int) error {
	const op = "learningservice.UpdateSceneOrder"

	if err := s.repo.UpdateOrder(ctx, id, order); err != nil {
		return richerror.New(op).WithErr(err)
	}

	return nil
}

// UpdateSceneDifficulty فقط سطح یک صحنه را تغییر می‌دهد؛ برخلاف ویرایش کامل،
// شناسه‌ی دیالوگ‌ها و پیشرفت کاربرها حفظ می‌شود.
func (s Service) UpdateSceneDifficulty(ctx context.Context, id, difficulty string) error {
	const op = "learningservice.UpdateSceneDifficulty"

	level, err := toDifficulty(op, difficulty)
	if err != nil {
		return err
	}
	if err := s.repo.UpdateDifficulty(ctx, id, string(level)); err != nil {
		return richerror.New(op).WithErr(err)
	}

	return nil
}
