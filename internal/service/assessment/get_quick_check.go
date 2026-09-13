package assessmentservice

import (
	"context"

	"shadowing-backend/internal/domain/assessment"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/assessment/dto"
)

// GetTest سه آیتم تست تعیین سطح را رندوم از استخرهای پنل ادمین برمی‌گرداند:
// یک معرفی خود، یک موقعیت آزاد، و یک جمله‌ی shadow. اگر ادمین هنوز محتوایی
// برای یکی از این دسته‌ها نساخته باشد، خطای واضح برمی‌گردد تا موبایل بی‌سروصدا
// گیت را رد کند، نه اینکه با داده‌ی ناقص کار کند.
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
	shadow, err := s.items.RandomActive(ctx, assessment.KindShadow, "")
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("assessment content not configured yet")
	}

	return &dto.GetTestResponse{
		Items: []dto.ItemDTO{
			toItemDTO(intro),
			toItemDTO(situational),
			toItemDTO(shadow),
		},
	}, nil
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
