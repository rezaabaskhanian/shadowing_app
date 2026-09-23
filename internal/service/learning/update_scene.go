package learningservice

import (
	"context"

	scene "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/learning/dto"
)

// UpdateScene یک صحنه‌ی موجود را با اطلاعات جدید (شامل هات‌اسپات‌ها و دیالوگ‌ها) به‌روزرسانی می‌کند.
// زمان ساخت از رکورد فعلی حفظ می‌شود؛ IsLocked، وضعیت انتشار (IsPublished) و
// ترتیب دستی (Order، اگر داده شده باشد) از درخواست گرفته می‌شوند.
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
	hotspots, err := s.buildHotspots(ctx, op, req.Hotspots)
	if err != nil {
		return dto.Scene{}, err
	}
	// اطمینان از اتصال هات‌اسپات‌ها به همین صحنه
	for i := range hotspots {
		hotspots[i].SceneID = existing.ID
	}

	// ========== 5️⃣ مونتاژ صحنه‌ی به‌روزشده ==========
	// ترتیب دستیِ جدید = درج در همان جایگاه (بقیه یکی عقب می‌روند)؛
	// خالی/بدون تغییر = حفظ ترتیب فعلی.
	order := existing.Order
	if req.Order > 0 && req.Order != existing.Order {
		if err := s.repo.ShiftOrdersFrom(ctx, req.Order, string(existing.ID)); err != nil {
			return dto.Scene{}, richerror.New(op).WithErr(err)
		}
		order = req.Order
	}

	grammarTopic, grammarExplanation, grammarExamples, grammarAudioURL := buildGrammarNote(req)
	updated := scene.Scene{
		ID:                 existing.ID,
		Title:              req.Title,
		Description:        req.Description,
		BackgroundImageURL: req.BackgroundImageURL,
		Difficulty:         difficultyLevel,
		Status:             statusFromRequest(req.IsPublished, existing.Status),
		Hotspots:           hotspots,
		Order:              order,
		IsLocked:           req.IsLocked,
		Category:           req.Category,
		GrammarTopic:       grammarTopic,
		GrammarExplanation: grammarExplanation,
		GrammarExamples:    grammarExamples,
		GrammarAudioURL:    grammarAudioURL,
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

	// تشخیص گفتار صداهای مرجع در پس‌زمینه (به دلیل کندی، هم‌زمان با
	// درخواست پنل ادمین اجرا نمی‌شود — به processWordTimingsAsync در
	// build.go نگاه کنید).
	go s.processWordTimingsAsync(updated.Hotspots)

	return toSceneDTO(updated), nil
}

// statusFromRequest وضعیت جدید صحنه را از تیک «انتشار» پنل ادمین می‌سازد:
// تیک‌خورده = published؛ برداشتن تیک = draft (صحنه‌ی آرشیوشده آرشیو می‌ماند).
func statusFromRequest(isPublished bool, current scene.SceneStatus) scene.SceneStatus {
	if isPublished {
		return scene.StatusPublished
	}
	if current == scene.StatusPublished {
		return scene.StatusDraft
	}
	return current
}
