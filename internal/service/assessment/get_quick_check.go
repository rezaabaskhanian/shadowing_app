package assessmentservice

import (
	"context"

	"shadowing-backend/internal/domain/assessment"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/assessment/dto"
)

// شادویینگ‌های سطح‌بندی‌شده — یکی از هر سطح دشواری، نه یک جمله‌ی تصادفی از
// کل استخر. با میانگین‌گیری از این سه نمره (به‌جای تکیه بر یک جمله‌ی شانسی)
// Level قابل‌اتکاتر می‌شود، بدون اینکه به یک تست تطبیقیِ چندمرحله‌ای (که نیاز
// به نگه‌داشتن وضعیت بین درخواست‌ها دارد) نیاز باشد.
var shadowDifficultyTiers = []assessment.Difficulty{
	assessment.DifficultyBeginner,
	assessment.DifficultyIntermediate,
	assessment.DifficultyAdvanced,
}

// GetTest پنج آیتم تست تعیین سطح را رندوم از استخرهای پنل ادمین برمی‌گرداند:
// یک معرفی خود، یک موقعیت آزاد، و سه جمله‌ی shadow (یکی از هر سطح دشواری).
// اگر ادمین هنوز محتوایی برای یکی از این دسته‌ها نساخته باشد، خطای واضح
// برمی‌گردد تا موبایل بی‌سروصدا گیت را رد کند، نه اینکه با داده‌ی ناقص کار کند.
func (s *Service) GetTest(ctx context.Context) (*dto.GetTestResponse, error) {
	const op = "assessment.GetTest"

	intro, err := s.items.RandomActive(ctx, assessment.KindFreeSpeech, assessment.CategoryIntro)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("assessment content not configured yet")
	}
	situational, err := s.items.RandomActive(ctx, assessment.KindFreeSpeech, assessment.CategorySituational)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("assessment content not configured yet")
	}

	items := []dto.ItemDTO{toItemDTO(intro), toItemDTO(situational)}
	for _, difficulty := range shadowDifficultyTiers {
		shadow, err := s.items.RandomActiveShadow(ctx, difficulty)
		if err != nil {
			return nil, richerror.New(op).WithErr(err).WithMessage("assessment content not configured yet")
		}
		items = append(items, toItemDTO(shadow))
	}

	return &dto.GetTestResponse{Items: items}, nil
}

func toItemDTO(it *assessment.AssessmentItem) dto.ItemDTO {
	d := dto.ItemDTO{
		ID:         it.ID.String(),
		Kind:       string(it.Kind),
		PromptText: it.PromptText,
		Difficulty: string(it.Difficulty),
	}
	if it.Kind == assessment.KindFreeSpeech {
		d.Category = string(it.Category)
	}
	if it.Kind == assessment.KindShadow {
		d.TargetText = it.TargetText
		d.AudioURL = it.AudioURL
	}
	return d
}
