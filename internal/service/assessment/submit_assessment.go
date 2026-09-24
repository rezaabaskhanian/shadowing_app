package assessmentservice

import (
	"context"
	"log/slog"
	"math"
	"os"
	"sync"

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

	// آیتم‌ها مستقل از هم‌اند (هر کدام صدای خودشان را رونویسی/نمره‌دهی
	// می‌کنند)، پس هم‌زمان پردازش می‌شوند نه پشت‌سرهم — با ۵ آیتم و چند
	// فراخوانیِ شبکه‌ای (Whisper + AI) به‌ازای هرکدام، پردازشِ ترتیبی چند
	// برابر بیشتر از لازم طول می‌کشید. هر گوروتین فقط اندیسِ خودش را در
	// outcomes می‌نویسد، پس رقابتی روی حافظه‌ی مشترک وجود ندارد.
	outcomes := make([]itemOutcome, len(submitted))
	var wg sync.WaitGroup
	for i, sub := range submitted {
		wg.Add(1)
		go func(i int, sub dto.SubmitItem) {
			defer wg.Done()
			outcomes[i] = s.processItem(ctx, userID, sub, itemByID)
		}(i, sub)
	}
	wg.Wait()

	var results []dto.ItemResultDTO
	var shadowResults []speecheval.EvaluationResult
	for _, o := range outcomes {
		if o.result != nil {
			results = append(results, *o.result)
		}
		if o.shadow != nil {
			shadowResults = append(shadowResults, *o.shadow)
		}
	}

	if len(shadowResults) == 0 {
		return nil, richerror.New(op).
			WithMessage("quick check incomplete: no shadow item was submitted").
			WithKind(richerror.KindInvalid)
	}

	avgOverall, avgPronunciation, avgFluency, anyEstimated := averageShadowResults(shadowResults)
	profile, err := assessment.NewSpeakingProfile(userID, avgOverall, avgPronunciation, avgFluency, anyEstimated)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if err := s.profiles.Upsert(ctx, profile); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	s.clearManualLevel(ctx, userID)

	return &dto.SubmitAssessmentResponse{
		Level:              string(profile.Level),
		OverallScore:       profile.OverallScore,
		PronunciationScore: profile.PronunciationScore,
		FluencyScore:       profile.FluencyScore,
		IsEstimated:        profile.IsEstimated,
		Items:              results,
	}, nil
}

// itemOutcome نتیجه‌ی پردازشِ یک آیتم — هر گوروتین یکی از این‌ها را در
// اندیسِ خودش در outcomes می‌نویسد، بدون نیاز به قفل.
type itemOutcome struct {
	result *dto.ItemResultDTO
	shadow *speecheval.EvaluationResult
}

// processItem یک آیتم ارسالی را پردازش می‌کند و همیشه (موفق یا ناموفق) فایل
// موقت آن را پاک می‌کند — مطابق قاعده‌ی کلی پروژه که صدای کاربر روی سرور
// نگه‌داری نمی‌شود.
func (s *Service) processItem(
	ctx context.Context,
	userID uuid.UUID,
	sub dto.SubmitItem,
	itemByID map[uuid.UUID]assessment.AssessmentItem,
) itemOutcome {
	defer func() {
		if err := os.Remove(sub.LocalAudioPath); err != nil && !os.IsNotExist(err) {
			slog.Warn("assessment: failed to remove temp recording", "err", err)
		}
	}()

	id, err := uuid.Parse(sub.ItemID)
	if err != nil {
		return itemOutcome{}
	}
	item, ok := itemByID[id]
	if !ok {
		return itemOutcome{}
	}

	switch item.Kind {
	case assessment.KindShadow:
		result := s.evaluator.Evaluate(ctx, speecheval.Input{
			TargetText:      item.TargetText,
			AudioPath:       sub.LocalAudioPath,
			DurationSeconds: sub.Duration,
		})

		pron, flu, ov := result.PronunciationScore, result.FluencyScore, result.OverallScore
		if err := s.log.Insert(ctx, userID, item.ID, result.Transcript, "", "", "", "", &pron, &flu, &ov); err != nil {
			slog.Warn("assessment: failed to log submission item", "err", err)
		}
		return itemOutcome{
			result: &dto.ItemResultDTO{
				ItemID:             sub.ItemID,
				Kind:               string(item.Kind),
				PronunciationScore: &pron,
				FluencyScore:       &flu,
				OverallScore:       &ov,
			},
			shadow: &result,
		}

	case assessment.KindFreeSpeech:
		transcript, answered, feedback, grammarCorrection, grammarExplanation := s.evaluateFreeSpeech(ctx, item, sub.LocalAudioPath)
		if err := s.log.Insert(ctx, userID, item.ID, transcript, answered, feedback, grammarCorrection, grammarExplanation, nil, nil, nil); err != nil {
			slog.Warn("assessment: failed to log submission item", "err", err)
		}
		return itemOutcome{
			result: &dto.ItemResultDTO{
				ItemID:             sub.ItemID,
				Kind:               string(item.Kind),
				Transcript:         transcript,
				RelevanceAnswered:  answered,
				RelevanceFeedback:  feedback,
				GrammarCorrection:  grammarCorrection,
				GrammarExplanation: grammarExplanation,
			},
		}
	}

	return itemOutcome{}
}

// averageShadowResults نمره‌ی نهایی را از میانگین چند جمله‌ی shadow (معمولاً
// یکی از هر سطح دشواری) می‌سازد، نه از یک جمله‌ی تکی — یک جمله‌ی سخت که
// شانسی بد گفته شود دیگر به‌تنهایی کل Level را خراب نمی‌کند.
func averageShadowResults(results []speecheval.EvaluationResult) (avgOverall, avgPronunciation, avgFluency float64, anyEstimated bool) {
	n := float64(len(results))
	for _, r := range results {
		avgOverall += r.OverallScore
		avgPronunciation += r.PronunciationScore
		avgFluency += r.FluencyScore
		anyEstimated = anyEstimated || r.Estimated
	}
	return round1(avgOverall / n), round1(avgPronunciation / n), round1(avgFluency / n), anyEstimated
}

func round1(v float64) float64 {
	return math.Round(v*10) / 10
}

// evaluateFreeSpeech رونویسی + بررسیِ ربط + بررسیِ گرامر را انجام می‌دهد.
// ربط و گرامر مستقل از هم هستند (هر دو فقط به transcript نیاز دارند)، پس
// هم‌زمان فراخوانی می‌شوند نه پشت‌سرهم — دو فراخوانیِ AI پشت‌سرهم تقریباً دو
// برابرِ یک فراخوانی طول می‌کشید. شکستِ یکی مانع محاسبه‌ی دیگری نمی‌شود، و
// هیچ‌کدام کل ارسال را نمی‌شکند (فقط فیلدهای مربوطه خالی می‌مانند).
func (s *Service) evaluateFreeSpeech(ctx context.Context, item assessment.AssessmentItem, audioPath string) (transcript, answered, feedback, grammarCorrection, grammarExplanation string) {
	transcript, err := s.evaluator.TranscribeOnly(ctx, audioPath)
	if err != nil {
		slog.Warn("assessment: transcription failed", "err", err)
		return "", "no", unavailableFeedback, "", ""
	}

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		if rel, err := s.ai.CheckAnswerRelevance(ctx, item.PromptText, transcript); err == nil {
			answered, feedback = rel.Answered, rel.Feedback
		} else {
			slog.Warn("assessment: relevance check failed", "err", err)
			answered, feedback = "no", unavailableFeedback
		}
	}()

	go func() {
		defer wg.Done()
		if grammar, err := s.ai.CheckGrammar(ctx, transcript); err == nil {
			grammarCorrection, grammarExplanation = grammar.Corrected, grammar.Explanation
		} else {
			slog.Warn("assessment: grammar check failed", "err", err)
		}
	}()

	wg.Wait()
	return transcript, answered, feedback, grammarCorrection, grammarExplanation
}
