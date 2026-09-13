package assessmentservice

import (
	"context"
	"log/slog"
	"os"

	"shadowing-backend/internal/domain/assessment"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/assessment/dto"
	"shadowing-backend/internal/service/speecheval"

	"github.com/google/uuid"
)

const unavailableFeedback = "متاسفانه امکان تحلیل این بخش وجود نداشت."

// SubmitAssessment آیتم‌های ارسالی را پردازش می‌کند: آیتم shadow نمره‌ی واقعی
// می‌گیرد و Level را می‌سازد؛ آیتم‌های free_speech فقط رونویسی + بررسی ربط
// می‌شوند (بدون نمره‌ی ساختگی). هرگز به kind/متن ارسالی کلاینت اعتماد نمی‌شود؛
// همه چیز از روی AssessmentItemِ واقعی (با item_id) خوانده می‌شود.
func (s *Service) SubmitAssessment(ctx context.Context, userIDStr string, submitted []dto.SubmitItem) (*dto.SubmitAssessmentResponse, error) {
	const op = "assessment.SubmitAssessment"

	if len(submitted) == 0 {
		return nil, richerror.New(op).WithMessage("no items submitted").WithKind(richerror.KindInvalid)
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}

	ids := make([]uuid.UUID, 0, len(submitted))
	for _, it := range submitted {
		id, err := uuid.Parse(it.ItemID)
		if err != nil {
			return nil, richerror.New(op).WithErr(err).WithMessage("invalid item ID").WithKind(richerror.KindInvalid)
		}
		ids = append(ids, id)
	}

	items, err := s.items.GetByIDs(ctx, ids)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	itemByID := make(map[uuid.UUID]assessment.AssessmentItem, len(items))
	for _, it := range items {
		itemByID[it.ID] = it
	}

	var results []dto.ItemResultDTO
	var shadowResult *speecheval.EvaluationResult

	for _, sub := range submitted {
		s.processItem(ctx, userID, sub, itemByID, &results, &shadowResult)
	}

	if shadowResult == nil {
		return nil, richerror.New(op).
			WithMessage("quick check incomplete: no shadow item was submitted").
			WithKind(richerror.KindInvalid)
	}

	profile, err := assessment.NewSpeakingProfile(
		userID, shadowResult.OverallScore, shadowResult.PronunciationScore, shadowResult.FluencyScore, shadowResult.Estimated,
	)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if err := s.profiles.Upsert(ctx, profile); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	return &dto.SubmitAssessmentResponse{
		Level:              string(profile.Level),
		OverallScore:       profile.OverallScore,
		PronunciationScore: profile.PronunciationScore,
		FluencyScore:       profile.FluencyScore,
		IsEstimated:        profile.IsEstimated,
		Items:              results,
	}, nil
}

// processItem یک آیتم ارسالی را پردازش می‌کند و همیشه (موفق یا ناموفق) فایل
// موقت آن را پاک می‌کند — مطابق قاعده‌ی کلی پروژه که صدای کاربر روی سرور
// نگه‌داری نمی‌شود.
func (s *Service) processItem(
	ctx context.Context,
	userID uuid.UUID,
	sub dto.SubmitItem,
	itemByID map[uuid.UUID]assessment.AssessmentItem,
	results *[]dto.ItemResultDTO,
	shadowResult **speecheval.EvaluationResult,
) {
	defer func() {
		if err := os.Remove(sub.LocalAudioPath); err != nil && !os.IsNotExist(err) {
			slog.Warn("assessment: failed to remove temp recording", "err", err)
		}
	}()

	id, err := uuid.Parse(sub.ItemID)
	if err != nil {
		return
	}
	item, ok := itemByID[id]
	if !ok {
		return
	}

	switch item.Kind {
	case assessment.KindShadow:
		result := s.evaluator.Evaluate(ctx, speecheval.Input{
			TargetText:      item.TargetText,
			AudioPath:       sub.LocalAudioPath,
			DurationSeconds: sub.Duration,
		})
		*shadowResult = &result

		pron, flu, ov := result.PronunciationScore, result.FluencyScore, result.OverallScore
		*results = append(*results, dto.ItemResultDTO{
			ItemID:             sub.ItemID,
			Kind:               string(item.Kind),
			PronunciationScore: &pron,
			FluencyScore:       &flu,
			OverallScore:       &ov,
		})
		if err := s.log.Insert(ctx, userID, item.ID, result.Transcript, "", "", &pron, &flu, &ov); err != nil {
			slog.Warn("assessment: failed to log submission item", "err", err)
		}

	case assessment.KindFreeSpeech:
		transcript, answered, feedback := s.evaluateFreeSpeech(ctx, item, sub.LocalAudioPath)
		*results = append(*results, dto.ItemResultDTO{
			ItemID:            sub.ItemID,
			Kind:              string(item.Kind),
			Transcript:        transcript,
			RelevanceAnswered: answered,
			RelevanceFeedback: feedback,
		})
		if err := s.log.Insert(ctx, userID, item.ID, transcript, answered, feedback, nil, nil, nil); err != nil {
			slog.Warn("assessment: failed to log submission item", "err", err)
		}
	}
}

func (s *Service) evaluateFreeSpeech(ctx context.Context, item assessment.AssessmentItem, audioPath string) (transcript, answered, feedback string) {
	transcript, err := s.evaluator.TranscribeOnly(ctx, audioPath)
	if err != nil {
		slog.Warn("assessment: transcription failed", "err", err)
		return "", "no", unavailableFeedback
	}

	rel, err := s.ai.CheckAnswerRelevance(ctx, item.PromptText, transcript)
	if err != nil {
		slog.Warn("assessment: relevance check failed", "err", err)
		return transcript, "no", unavailableFeedback
	}
	return transcript, rel.Answered, rel.Feedback
}
