package freespeechservice

import (
	"context"
	"log/slog"
	"os"
	"strings"
	"sync"

	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/freespeech/dto"

	"github.com/google/uuid"
)

const unavailableFeedback = "متاسفانه امکان تحلیل این بخش وجود نداشت."

// promptFor پرامپتِ Free Speech را از عنوان/دسته‌ی خودِ صحنه می‌سازد — عیناً
// هم‌الگوی aiconversation که پرسوناژ را از متادیتای صحنه استنتاج می‌کند، نه
// از محتوای ادمین‌ساخته‌ی جداگانه (بخش ۱۶ سند: باید به موقعیتِ واقعی وصل
// بماند، نه موضوعِ رهاشده‌ی عمومی).
func promptFor(sceneTitle string) string {
	return "Describe, in your own words, what happened in this situation: " + sceneTitle
}

// Analyze یک ضبطِ آزادِ کاربر (بعد از تمام‌کردنِ یک صحنه) را رونویسی و
// تحلیل می‌کند — بدون امتیازِ عددی، بدون مکالمه‌ی چندنوبتی، عیناً هم‌الگوی
// evaluateFreeSpeech در assessmentservice. صدای کاربر هیچ‌وقت روی سرور نگه
// داشته نمی‌شود.
func (s *Service) Analyze(ctx context.Context, userIDStr, sceneIDStr, localAudioPath string) (*dto.AnalyzeResponse, error) {
	const op = "freespeech.Analyze"

	defer func() {
		if err := os.Remove(localAudioPath); err != nil && !os.IsNotExist(err) {
			slog.Warn("freespeech: failed to remove temp recording", "err", err)
		}
	}()

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}
	sceneID, err := uuid.Parse(sceneIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid scene ID").WithKind(richerror.KindInvalid)
	}

	sc, err := s.scenes.GetByID(ctx, sceneIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("scene not found").WithKind(richerror.KindNotFound)
	}

	transcript, err := s.transcriber.TranscribeOnly(ctx, localAudioPath)
	if err != nil || strings.TrimSpace(transcript) == "" {
		return nil, richerror.New(op).WithErr(err).
			WithMessage("didn't catch that, please try again").WithKind(richerror.KindInvalid)
	}

	var answered, feedback, grammarCorrection, grammarExplanation string

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		if rel, relErr := s.ai.CheckAnswerRelevance(ctx, promptFor(sc.Title), transcript); relErr == nil {
			answered, feedback = rel.Answered, rel.Feedback
		} else {
			slog.Warn("freespeech: relevance check failed", "err", relErr)
			answered, feedback = "no", unavailableFeedback
		}
	}()

	go func() {
		defer wg.Done()
		if grammar, grammarErr := s.ai.CheckGrammar(ctx, transcript); grammarErr == nil {
			grammarCorrection, grammarExplanation = grammar.Corrected, grammar.Explanation
		} else {
			slog.Warn("freespeech: grammar check failed", "err", grammarErr)
		}
	}()

	wg.Wait()

	if err := s.log.Insert(ctx, userID, sceneID, transcript, answered, feedback, grammarCorrection, grammarExplanation); err != nil {
		slog.Warn("freespeech: failed to log attempt", "err", err)
	}

	return &dto.AnalyzeResponse{
		Transcript:         transcript,
		RelevanceAnswered:  answered,
		RelevanceFeedback:  feedback,
		GrammarCorrection:  grammarCorrection,
		GrammarExplanation: grammarExplanation,
	}, nil
}
