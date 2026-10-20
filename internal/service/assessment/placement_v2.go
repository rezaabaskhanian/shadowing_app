package assessmentservice

import (
	"context"
	"log/slog"
	"math/rand"
	"os"
	"sort"
	"sync"
	"time"

	"shadowing-backend/internal/domain/assessment"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/assessment/dto"

	"github.com/google/uuid"
)

// تست تعیین سطح نسخه‌ی ۲ (document_placement/placement_design.md). کل استخر
// بخش‌ها یک‌جا فرستاده می‌شود و اپ قاعده‌های تطبیقی (کدام لایه/سطح بعدی) را
// اجرا می‌کند؛ نمره‌ی نهایی فقط از روی آیتم‌های واقعیِ پایگاه‌داده روی سرور
// حساب می‌شود و به ادعای کلاینت درباره‌ی درست/غلط اعتماد نمی‌شود.

const (
	vocabWordsPerBand   = 12
	vocabPseudoWords    = 20
	listenItemsPerLevel = 3
	maxImitationItems   = 8
	// سهم کلمه‌های ساختگی که در دور اول (لایه‌های ۱ تا ۳) پخش می‌شوند.
	pseudoStageOneShare = 0.6
)

// GetTestV2 آیتم‌های سه بخش (و معرفی خود اختیاری) را برمی‌گرداند.
func (s *Service) GetTestV2(ctx context.Context) (*dto.GetTestV2Response, error) {
	const op = "assessment.GetTestV2"

	items, err := s.items.ListActiveByKinds(ctx, []assessment.Kind{
		assessment.KindVocabYesNo, assessment.KindListenChoice, assessment.KindImitation,
	})
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	resp := &dto.GetTestV2Response{}
	perBand := map[int]int{}
	perLevel := map[assessment.Level]int{}
	var pseudos []assessment.AssessmentItem
	var imitation []assessment.AssessmentItem
	for _, it := range items { // ترتیب از قبل تصادفی است (ORDER BY random())
		switch it.Kind {
		case assessment.KindVocabYesNo:
			if it.IsPseudo {
				if len(pseudos) < vocabPseudoWords {
					pseudos = append(pseudos, it)
				}
				continue
			}
			if perBand[it.Band] >= vocabWordsPerBand {
				continue
			}
			perBand[it.Band]++
			stage := 1
			if it.Band >= 4 {
				stage = 2
			}
			resp.Vocab = append(resp.Vocab, dto.VocabItemDTO{ID: it.ID.String(), Word: it.PromptText, Band: it.Band, Stage: stage})
		case assessment.KindListenChoice:
			if perLevel[it.CEFR] >= listenItemsPerLevel {
				continue
			}
			perLevel[it.CEFR]++
			resp.Listening = append(resp.Listening, dto.ListenItemDTO{
				ID: it.ID.String(), CEFR: string(it.CEFR), AudioURL: it.AudioURL, Prompt: it.PromptText,
				Options: it.Options, CorrectIndex: it.CorrectIndex,
			})
		case assessment.KindImitation:
			imitation = append(imitation, it)
		}
	}

	stageOne := int(float64(len(pseudos))*pseudoStageOneShare + 0.5)
	for i, it := range pseudos {
		stage := 2
		if i < stageOne {
			stage = 1
		}
		resp.Vocab = append(resp.Vocab, dto.VocabItemDTO{ID: it.ID.String(), Word: it.PromptText, Stage: stage})
	}
	// کلمه‌های ساختگی بین کلمه‌های واقعی هر دور پخش شوند، نه آخر لیست.
	rand.Shuffle(len(resp.Vocab), func(i, j int) { resp.Vocab[i], resp.Vocab[j] = resp.Vocab[j], resp.Vocab[i] })
	sort.SliceStable(resp.Vocab, func(i, j int) bool { return resp.Vocab[i].Stage < resp.Vocab[j].Stage })

	sort.SliceStable(resp.Listening, func(i, j int) bool {
		return assessment.Level(resp.Listening[i].CEFR).Rank() < assessment.Level(resp.Listening[j].CEFR).Rank()
	})

	// جمله‌های تکرار از کوتاه به بلند؛ در هر سطح اول کوتاه‌ترین.
	sort.SliceStable(imitation, func(i, j int) bool {
		ri, rj := imitation[i].CEFR.Rank(), imitation[j].CEFR.Rank()
		if ri != rj {
			return ri < rj
		}
		return len(imitation[i].TargetText) < len(imitation[j].TargetText)
	})
	if len(imitation) > maxImitationItems {
		imitation = imitation[:maxImitationItems]
	}
	for _, it := range imitation {
		resp.Imitation = append(resp.Imitation, dto.ImitationItemDTO{ID: it.ID.String(), CEFR: string(it.CEFR), AudioURL: it.AudioURL})
	}

	if len(resp.Vocab) == 0 || len(resp.Listening) == 0 || len(resp.Imitation) == 0 {
		return nil, richerror.New(op).WithMessage("assessment v2 content not configured yet").WithKind(richerror.KindNotFound)
	}

	if intro, err := s.items.RandomActive(ctx, assessment.KindFreeSpeech, assessment.CategoryIntro); err == nil {
		d := toItemDTO(intro)
		resp.Intro = &d
	}
	return resp, nil
}

// SubmitTestV2 پاسخ‌ها را نمره می‌دهد، پروفایل و تاریخچه را ذخیره می‌کند.
// audio شامل جمله‌های تکرار و (اختیاری) معرفی خود است.
func (s *Service) SubmitTestV2(ctx context.Context, userIDStr string, answers dto.SubmitV2Answers, audio []dto.SubmitItem) (*dto.SubmitV2Response, error) {
	const op = "assessment.SubmitTestV2"

	// صدای کاربر روی سرور نگه داشته نمی‌شود، حتی اگر جایی زودتر برگردیم.
	defer func() {
		for _, a := range audio {
			if err := os.Remove(a.LocalAudioPath); err != nil && !os.IsNotExist(err) {
				slog.Warn("assessment v2: failed to remove temp recording", "err", err)
			}
		}
	}()

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}
	if len(answers.Vocab) == 0 || len(answers.Listening) == 0 {
		return nil, richerror.New(op).WithMessage("vocabulary and listening answers are required").WithKind(richerror.KindInvalid)
	}

	itemByID, err := s.loadItems(ctx, answers, audio)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// بخش ۱: لغت
	var vocabAnswers []assessment.VocabAnswer
	for _, a := range answers.Vocab {
		it, ok := itemByID[a.ItemID]
		if !ok || it.Kind != assessment.KindVocabYesNo {
			continue
		}
		vocabAnswers = append(vocabAnswers, assessment.VocabAnswer{Band: it.Band, IsPseudo: it.IsPseudo, Known: a.Known})
	}
	vocab := assessment.EstimateVocab(vocabAnswers)

	// بخش ۲: شنیدن
	var listenAnswers []assessment.LevelAnswer
	for _, a := range answers.Listening {
		it, ok := itemByID[a.ItemID]
		if !ok || it.Kind != assessment.KindListenChoice {
			continue
		}
		listenAnswers = append(listenAnswers, assessment.LevelAnswer{Level: it.CEFR, Passed: a.Choice == it.CorrectIndex})
	}
	if len(listenAnswers) == 0 {
		return nil, richerror.New(op).WithMessage("no valid listening answer").WithKind(richerror.KindInvalid)
	}
	listening := assessment.HighestPassedLevel(listenAnswers)

	// بخش ۳ و ۴: صداها هم‌زمان رونویسی می‌شوند.
	imitation, intro := s.processV2Audio(ctx, userID, audio, itemByID)

	var speakAnswers []assessment.LevelAnswer
	var accSum float64
	for _, r := range imitation {
		speakAnswers = append(speakAnswers, assessment.LevelAnswer{Level: assessment.Level(r.CEFR), Passed: r.Passed})
		accSum += r.Accuracy
	}
	// اگر رونویسی هیچ جمله‌ای در دسترس نبود (قطعی سرویس)، صحبت را اندازه
	// نگرفته‌ایم و کاربر را به خاطرش پایین نمی‌آوریم.
	speakingMeasured := len(speakAnswers) > 0
	var decision assessment.PlacementDecision
	if speakingMeasured {
		decision = assessment.DecidePlacement(vocab, listening, assessment.HighestAnyPassedLevel(speakAnswers))
	} else {
		decision = assessment.DecidePlacement(vocab, listening, listening)
		decision.Speaking = ""
	}
	avgAccuracy := 0.0
	if len(imitation) > 0 {
		avgAccuracy = accSum / float64(len(imitation))
	}

	previous, err := s.profiles.LastResult(ctx, userID)
	if err != nil {
		slog.Warn("assessment v2: failed to load previous result", "err", err)
		previous = nil
	}

	now := time.Now()
	score := round1(avgAccuracy * 100)
	profile := &assessment.SpeakingProfile{
		ID:                 uuid.New(),
		UserID:             userID,
		Level:              decision.Start,
		OverallScore:       score,
		PronunciationScore: score,
		FluencyScore:       score,
		IsEstimated:        !speakingMeasured,
		TestVersion:        2,
		ComprehensionLevel: decision.Comprehension,
		SpeakingLevel:      decision.Speaking,
		ListeningLevel:     listening,
		VocabLevel:         vocab.Level,
		VocabSize:          vocab.Size,
		VocabValid:         vocab.Valid,
		AssessedAt:         now,
		CreatedAt:          now,
		UpdatedAt:          now,
	}
	if err := s.profiles.Upsert(ctx, profile); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if err := s.profiles.InsertResult(ctx, profile, avgAccuracy); err != nil {
		slog.Warn("assessment v2: failed to save result history", "err", err)
	}
	s.clearManualLevel(ctx, userID)

	resp := &dto.SubmitV2Response{
		Level:              string(decision.Start),
		SceneLevel:         assessment.SceneDifficulty(decision.Start),
		ComprehensionLevel: string(decision.Comprehension),
		SpeakingLevel:      string(decision.Speaking),
		ListeningLevel:     string(listening),
		VocabLevel:         string(vocab.Level),
		VocabSize:          vocab.Size,
		VocabValid:         vocab.Valid,
		SpeakingMeasured:   speakingMeasured,
		Imitation:          imitation,
		Intro:              intro,
	}
	if previous != nil {
		resp.Previous = &dto.PreviousResultDTO{
			Level:              string(previous.Level),
			ComprehensionLevel: string(previous.ComprehensionLevel),
			SpeakingLevel:      string(previous.SpeakingLevel),
			VocabSize:          previous.VocabSize,
			AssessedAt:         previous.AssessedAt.Format(time.RFC3339),
		}
	}
	return resp, nil
}

func (s *Service) loadItems(ctx context.Context, answers dto.SubmitV2Answers, audio []dto.SubmitItem) (map[string]assessment.AssessmentItem, error) {
	seen := map[uuid.UUID]bool{}
	var ids []uuid.UUID
	add := func(raw string) {
		if id, err := uuid.Parse(raw); err == nil && !seen[id] {
			seen[id] = true
			ids = append(ids, id)
		}
	}
	for _, a := range answers.Vocab {
		add(a.ItemID)
	}
	for _, a := range answers.Listening {
		add(a.ItemID)
	}
	for _, a := range audio {
		add(a.ItemID)
	}
	items, err := s.items.GetByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	out := make(map[string]assessment.AssessmentItem, len(items))
	for _, it := range items {
		out[it.ID.String()] = it
	}
	return out, nil
}

// processV2Audio جمله‌های تکرار را رونویسی و با دقت کلمه نمره می‌دهد (بدون
// راهنمای واژگان، تا رونویسی به سمت جمله‌ی هدف کج نشود) و معرفی خود را مثل
// نسخه‌ی ۱ بازخورد می‌دهد. فایل‌ها را SubmitTestV2 پاک می‌کند.
func (s *Service) processV2Audio(ctx context.Context, userID uuid.UUID, audio []dto.SubmitItem, itemByID map[string]assessment.AssessmentItem) ([]dto.ImitationResultDTO, *dto.ItemResultDTO) {
	results := make([]*dto.ImitationResultDTO, len(audio))
	var intro *dto.ItemResultDTO
	var mu sync.Mutex
	var wg sync.WaitGroup
	for i, a := range audio {
		it, ok := itemByID[a.ItemID]
		if !ok {
			continue
		}
		wg.Add(1)
		go func(i int, a dto.SubmitItem, it assessment.AssessmentItem) {
			defer wg.Done()
			switch it.Kind {
			case assessment.KindImitation:
				transcript, err := s.evaluator.TranscribeOnly(ctx, a.LocalAudioPath)
				if err != nil {
					slog.Warn("assessment v2: imitation transcription failed", "err", err)
					return
				}
				acc := assessment.WordAccuracy(it.TargetText, transcript)
				ov := round1(acc * 100)
				if err := s.log.Insert(ctx, userID, it.ID, transcript, "", "", "", "", nil, nil, &ov); err != nil {
					slog.Warn("assessment v2: failed to log submission item", "err", err)
				}
				results[i] = &dto.ImitationResultDTO{
					ItemID: it.ID.String(), CEFR: string(it.CEFR), Accuracy: round2(acc),
					Passed: acc >= assessment.ImitationPassAccuracy, Transcript: transcript,
				}
			case assessment.KindFreeSpeech:
				transcript, answered, feedback, gc, ge := s.evaluateFreeSpeech(ctx, it, a.LocalAudioPath)
				if err := s.log.Insert(ctx, userID, it.ID, transcript, answered, feedback, gc, ge, nil, nil, nil); err != nil {
					slog.Warn("assessment v2: failed to log submission item", "err", err)
				}
				mu.Lock()
				intro = &dto.ItemResultDTO{
					ItemID: it.ID.String(), Kind: string(it.Kind), Transcript: transcript,
					RelevanceAnswered: answered, RelevanceFeedback: feedback,
					GrammarCorrection: gc, GrammarExplanation: ge,
				}
				mu.Unlock()
			}
		}(i, a, it)
	}
	wg.Wait()

	var out []dto.ImitationResultDTO
	for _, r := range results {
		if r != nil {
			out = append(out, *r)
		}
	}
	sort.SliceStable(out, func(i, j int) bool {
		return assessment.Level(out[i].CEFR).Rank() < assessment.Level(out[j].CEFR).Rank()
	})
	return out, intro
}

func round2(v float64) float64 {
	return float64(int(v*100+0.5)) / 100
}
