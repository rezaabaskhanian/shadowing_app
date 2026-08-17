package learningservice

import (
	"context"

	scene "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/learning/dto"
)

// UpdateScene یک صحنه‌ی موجود را با اطلاعات جدید (شامل هات‌اسپات‌ها و دیالوگ‌ها) به‌روزرسانی می‌کند.
// وضعیت (status)، ترتیب (order) و زمان ساخت از رکورد فعلی حفظ می‌شوند؛ IsLocked از درخواست گرفته می‌شود (ادمین می‌تواند تغییرش دهد).
func (s Service) UpdateScene(ctx context.Context, id string, req dto.CreateSceneRequest) (dto.Scene, error) {
	const op = "learningservice.UpdateScene"

	// ========== 1️⃣ اعتبارسنجی ورودی ==========
	if req.Title == "" {
		return dto.Scene{}, richerror.New(op).
			WithMessage("عنوان سناریو الزامی است").
			WithKind(richerror.KindForbidden)
	}
	if req.BackgroundImageURL == "" {
		return dto.Scene{}, richerror.New(op).
			WithMessage("آدرس تصویر پس‌زمینه الزامی است").
			WithKind(richerror.KindForbidden)
	}
	if len(req.Hotspots) == 0 {
		return dto.Scene{}, richerror.New(op).
			WithMessage("حداقل یک هات‌اسپات باید وجود داشته باشد").
			WithKind(richerror.KindForbidden)
	}

	// ========== 2️⃣ واکشی صحنه‌ی فعلی (برای حفظ status/order/createdAt و بررسی وجود) ==========
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return dto.Scene{}, richerror.New(op).WithErr(err)
	}

	// ========== 3️⃣ تبدیل Difficulty ==========
	difficultyLevel, err := toDifficulty(op, req.Difficulty)
	if err != nil {
		return dto.Scene{}, err
	}

	// ========== 4️⃣ ساخت هات‌اسپات‌ها با شناسه‌های تازه ==========
	hotspots, err := buildHotspots(op, req.Hotspots)
	if err != nil {
		return dto.Scene{}, err
	}
	// اطمینان از اتصال هات‌اسپات‌ها به همین صحنه
	for i := range hotspots {
		hotspots[i].SceneID = existing.ID
	}

	// ========== 5️⃣ مونتاژ صحنه‌ی به‌روزشده ==========
	updated := scene.Scene{
		ID:                 existing.ID,
		Title:              req.Title,
		Description:        req.Description,
		BackgroundImageURL: req.BackgroundImageURL,
		Difficulty:         difficultyLevel,
		Status:             existing.Status,
		Hotspots:           hotspots,
		Order:              existing.Order,
		IsLocked:           req.IsLocked,
		CreatedAt:          existing.CreatedAt,
		UpdatedAt:          existing.UpdatedAt,
	}

	// ========== 6️⃣ ذخیره ==========
	if err := s.repo.Update(ctx, updated); err != nil {
		return dto.Scene{}, richerror.New(op).
			WithErr(err).
			WithMessage("خطا در به‌روزرسانی سناریو").
			WithKind(richerror.KindUnexpected)
	}

	return toSceneDTO(updated), nil
}
