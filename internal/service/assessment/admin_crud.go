package assessmentservice

import (
	"context"
	"time"

	"shadowing-backend/internal/domain/assessment"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/assessment/dto"

	"github.com/google/uuid"
)

// CreateItem - افزودن یک آیتم تست تعیین سطح (پنل ادمین)
func (s *Service) CreateItem(ctx context.Context, req dto.CreateItemRequest) (dto.ItemAdminDTO, error) {
	const op = "assessment.CreateItem"

	item, err := assessment.NewAssessmentItem(
		assessment.Kind(req.Kind), assessment.Category(req.Category),
		req.PromptText, req.TargetText, req.AudioURL, assessment.Difficulty(req.Difficulty),
	)
	if err != nil {
		return dto.ItemAdminDTO{}, richerror.New(op).WithErr(err).WithKind(richerror.KindInvalid)
	}
	applyV2Fields(item, req.CEFR, req.Band, req.IsPseudo, req.Options, req.CorrectIndex)
	if err := item.ValidateV2(); err != nil {
		return dto.ItemAdminDTO{}, richerror.New(op).WithErr(err).WithKind(richerror.KindInvalid)
	}

	if err := s.items.Create(ctx, item); err != nil {
		return dto.ItemAdminDTO{}, richerror.New(op).WithErr(err)
	}
	return toItemAdminDTO(item), nil
}

// UpdateItem - ویرایش یک آیتم (پنل ادمین)
func (s *Service) UpdateItem(ctx context.Context, id string, req dto.UpdateItemRequest) (dto.ItemAdminDTO, error) {
	const op = "assessment.UpdateItem"

	itemID, err := uuid.Parse(id)
	if err != nil {
		return dto.ItemAdminDTO{}, richerror.New(op).WithErr(err).WithMessage("invalid item ID").WithKind(richerror.KindInvalid)
	}

	item, err := assessment.NewAssessmentItem(
		assessment.Kind(req.Kind), assessment.Category(req.Category),
		req.PromptText, req.TargetText, req.AudioURL, assessment.Difficulty(req.Difficulty),
	)
	if err != nil {
		return dto.ItemAdminDTO{}, richerror.New(op).WithErr(err).WithKind(richerror.KindInvalid)
	}
	applyV2Fields(item, req.CEFR, req.Band, req.IsPseudo, req.Options, req.CorrectIndex)
	if err := item.ValidateV2(); err != nil {
		return dto.ItemAdminDTO{}, richerror.New(op).WithErr(err).WithKind(richerror.KindInvalid)
	}
	item.ID = itemID
	item.IsActive = req.IsActive
	item.UpdatedAt = time.Now()

	if err := s.items.Update(ctx, item); err != nil {
		return dto.ItemAdminDTO{}, richerror.New(op).WithErr(err)
	}
	return toItemAdminDTO(item), nil
}

// DeleteItem - حذف یک آیتم (پنل ادمین)
func (s *Service) DeleteItem(ctx context.Context, id string) error {
	const op = "assessment.DeleteItem"

	itemID, err := uuid.Parse(id)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("invalid item ID").WithKind(richerror.KindInvalid)
	}
	if err := s.items.Delete(ctx, itemID); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// ListItems - همه‌ی آیتم‌ها برای جدول پنل ادمین (فعال و غیرفعال)
func (s *Service) ListItems(ctx context.Context) (dto.ListItemsResponse, error) {
	const op = "assessment.ListItems"

	items, err := s.items.List(ctx)
	if err != nil {
		return dto.ListItemsResponse{}, richerror.New(op).WithErr(err)
	}

	out := make([]dto.ItemAdminDTO, 0, len(items))
	for _, it := range items {
		out = append(out, toItemAdminDTO(&it))
	}
	return dto.ListItemsResponse{Items: out}, nil
}

func toItemAdminDTO(it *assessment.AssessmentItem) dto.ItemAdminDTO {
	return dto.ItemAdminDTO{
		ID:           it.ID.String(),
		Kind:         string(it.Kind),
		Category:     string(it.Category),
		PromptText:   it.PromptText,
		TargetText:   it.TargetText,
		AudioURL:     it.AudioURL,
		Difficulty:   string(it.Difficulty),
		CEFR:         string(it.CEFR),
		Band:         it.Band,
		IsPseudo:     it.IsPseudo,
		Options:      it.Options,
		CorrectIndex: it.CorrectIndex,
		IsActive:     it.IsActive,
		CreatedAt:    it.CreatedAt.Format(time.RFC3339),
	}
}

// applyV2Fields فیلدهای نسخه‌ی ۲ را روی آیتم می‌گذارد؛ هر kind فقط فیلدهای
// خودش را نگه می‌دارد تا داده‌ی بی‌معنا در پایگاه‌داده نماند.
func applyV2Fields(it *assessment.AssessmentItem, cefr string, band int, isPseudo bool, options []string, correct int) {
	switch it.Kind {
	case assessment.KindVocabYesNo:
		it.IsPseudo = isPseudo
		it.Band = band
		if isPseudo && band == 0 {
			it.Band = 1 // کلمه‌ی ساختگی لایه ندارد؛ فقط برای گذشتن از قید ۱..۵
		}
	case assessment.KindListenChoice:
		it.CEFR = assessment.Level(cefr)
		it.Options = options
		it.CorrectIndex = correct
	case assessment.KindImitation:
		it.CEFR = assessment.Level(cefr)
	}
}
