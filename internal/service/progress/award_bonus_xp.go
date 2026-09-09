package progressservice

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"
)

// AwardBonusXP مقدار XP اضافه (مثلاً از کوئیز درک شنیداری) را به رکورد
// پیشرفتِ همان کاربر/صحنه اضافه می‌کند — همان XP ای که در صفحه‌ی پیشرفت جمع
// زده می‌شود. اگر کاربر اصلاً این صحنه را تمرین نکرده (رکوردی وجود ندارد)،
// بی‌خطا کاری نمی‌کند؛ کوئیز فقط بعد از تمرین یک صحنه در دسترس است.
func (s *Service) AwardBonusXP(ctx context.Context, userID, sceneID string, xp int) error {
	const op = "progress.AwardBonusXP"

	if xp <= 0 {
		return nil
	}

	existing, err := s.sceneProRepo.GetByUserAndScene(ctx, userID, sceneID)
	if err != nil {
		if isNotFoundErr(err) {
			return nil
		}
		return richerror.New(op).WithErr(err)
	}

	existing.XP += xp
	if err := s.sceneProRepo.Update(ctx, existing); err != nil {
		return richerror.New(op).WithErr(err)
	}

	return nil
}
