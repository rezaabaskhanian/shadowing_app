package freespeechservice

import (
	"context"
	"log/slog"
	"os"
	"strings"
	"sync"
	"time"

	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/freespeech/dto"

	"github.com/google/uuid"
)

const unavailableFeedback = "متاسفانه امکان تحلیل این بخش وجود نداشت."

// maxTranscriptChars سقفِ طولِ متنی که Feedback می‌پذیرد. ۲۰ ثانیه صحبت
// حدود ۶۰ کلمه (~۴۰۰ نویسه) است؛ این سقف فقط جلوی سوءاستفاده از endpoint به
// عنوان یک پراکسیِ عمومیِ LLM را می‌گیرد.
const maxTranscriptChars = 1000

// promptFor پرامپتِ Free Speech را از عنوان/دسته‌ی خودِ صحنه می‌سازد — عیناً
// هم‌الگوی aiconversation که پرسوناژ را از متادیتای صحنه استنتاج می‌کند، نه
// از محتوای ادمین‌ساخته‌ی جداگانه (بخش ۱۶ سند: باید به موقعیتِ واقعی وصل
// بماند، نه موضوعِ رهاشده‌ی عمومی).
func promptFor(sceneTitle string) string {
	return "Describe, in your own words, what happened in this situation: " + sceneTitle
}

// Transcribe فقط صدا را رونویسی می‌کند (مرحله‌ی اول). اپ متن را همان لحظه به
// کاربر نشان می‌دهد و همزمان Feedback را می‌خواهد، تا کاربر منتظرِ تمامِ زنجیره‌ی
// «رونویسی + دو فراخوانیِ AI» نماند. صدای کاربر هیچ‌وقت روی سرور نگه داشته نمی‌شود.
func (s *Service) Transcribe(ctx context.Context, localAudioPath string) (*dto.TranscribeResponse, error) {
	const op = "freespeech.Transcribe"

	transcript, err := s.transcribeFile(ctx, localAudioPath)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).
			WithMessage("didn't catch that, please try again").WithKind(richerror.KindInvalid)
	}
	return &dto.TranscribeResponse{Transcript: transcript}, nil
}

// Feedback برای یک متنِ رونویسی‌شده، بازخوردِ ربط + تصحیحِ گرامری را می‌سازد
// (مرحله‌ی دوم) و تلاش را در لاگِ ممیزی ثبت می‌کند. بدون امتیازِ عددی.
func (s *Service) Feedback(ctx context.Context, userIDStr, sceneIDStr, transcript string) (*dto.FeedbackResponse, error) {
	const op = "freespeech.Feedback"

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}
	sceneID, err := uuid.Parse(sceneIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid scene ID").WithKind(richerror.KindInvalid)
	}

	transcript = strings.TrimSpace(transcript)
	if transcript == "" || len([]rune(transcript)) > maxTranscriptChars {
		return nil, richerror.New(op).WithMessage("invalid transcript").WithKind(richerror.KindInvalid)
	}

	sc, err := s.scenes.GetByID(ctx, sceneIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("scene not found").WithKind(richerror.KindNotFound)
	}

	fb := s.buildFeedback(ctx, promptFor(sc.Title), transcript)

	if err := s.log.Insert(ctx, userID, sceneID, transcript, fb.RelevanceAnswered, fb.RelevanceFeedback, fb.GrammarCorrection, fb.GrammarExplanation); err != nil {
		slog.Warn("freespeech: failed to log attempt", "err", err)
	}
	return &fb, nil
}

// Analyze همان دو مرحله را در یک درخواست انجام می‌دهد؛ برای نسخه‌های قدیمیِ
// اپ نگه داشته شده که هنوز /analyze را صدا می‌زنند. صدای کاربر هیچ‌وقت روی
// سرور نگه داشته نمی‌شود.
func (s *Service) Analyze(ctx context.Context, userIDStr, sceneIDStr, localAudioPath string) (*dto.AnalyzeResponse, error) {
	const op = "freespeech.Analyze"

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		s.removeTemp(localAudioPath)
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}
	sceneID, err := uuid.Parse(sceneIDStr)
	if err != nil {
		s.removeTemp(localAudioPath)
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid scene ID").WithKind(richerror.KindInvalid)
	}

	sc, err := s.scenes.GetByID(ctx, sceneIDStr)
	if err != nil {
		s.removeTemp(localAudioPath)
		return nil, richerror.New(op).WithErr(err).WithMessage("scene not found").WithKind(richerror.KindNotFound)
	}

	total := time.Now()
	transcript, err := s.transcribeFile(ctx, localAudioPath)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).
			WithMessage("didn't catch that, please try again").WithKind(richerror.KindInvalid)
	}

	fb := s.buildFeedback(ctx, promptFor(sc.Title), transcript)
	slog.Info("freespeech: analyze total", "total_ms", time.Since(total).Milliseconds())

	if err := s.log.Insert(ctx, userID, sceneID, transcript, fb.RelevanceAnswered, fb.RelevanceFeedback, fb.GrammarCorrection, fb.GrammarExplanation); err != nil {
		slog.Warn("freespeech: failed to log attempt", "err", err)
	}

	return &dto.AnalyzeResponse{
		Transcript:         transcript,
		RelevanceAnswered:  fb.RelevanceAnswered,
		RelevanceFeedback:  fb.RelevanceFeedback,
		GrammarCorrection:  fb.GrammarCorrection,
		GrammarExplanation: fb.GrammarExplanation,
	}, nil
}

// transcribeFile فایلِ موقت را رونویسی می‌کند و همیشه (موفق یا ناموفق) پاکش
// می‌کند. متنِ خالی هم خطا حساب می‌شود.
func (s *Service) transcribeFile(ctx context.Context, localAudioPath string) (string, error) {
	defer s.removeTemp(localAudioPath)

	transcript, err := s.transcriber.TranscribeOnly(ctx, localAudioPath)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(transcript) == "" {
		return "", errEmptyTranscript
	}
	return transcript, nil
}

func (s *Service) removeTemp(path string) {
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		slog.Warn("freespeech: failed to remove temp recording", "err", err)
	}
}

// buildFeedback ربط و گرامر را هم‌زمان می‌سازد (هر دو فقط به transcript نیاز
// دارند) — شکستِ یکی مانعِ دیگری نمی‌شود و هیچ‌کدام کلِ درخواست را نمی‌شکنند.
// زمانِ هر فراخوانی لاگ می‌شود تا معلوم باشد کندی از کدام است.
func (s *Service) buildFeedback(ctx context.Context, prompt, transcript string) dto.FeedbackResponse {
	var fb dto.FeedbackResponse
	fb.RelevanceAnswered = "no"
	fb.RelevanceFeedback = unavailableFeedback

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		start := time.Now()
		rel, err := s.ai.CheckAnswerRelevance(ctx, prompt, transcript)
		slog.Info("freespeech: relevance timing", "ms", time.Since(start).Milliseconds(), "ok", err == nil)
		if err != nil {
			slog.Warn("freespeech: relevance check failed", "err", err)
			return
		}
		fb.RelevanceAnswered, fb.RelevanceFeedback = rel.Answered, rel.Feedback
	}()

	go func() {
		defer wg.Done()
		start := time.Now()
		grammar, err := s.ai.CheckGrammar(ctx, transcript)
		slog.Info("freespeech: grammar timing", "ms", time.Since(start).Milliseconds(), "ok", err == nil)
		if err != nil {
			slog.Warn("freespeech: grammar check failed", "err", err)
			return
		}
		fb.GrammarCorrection, fb.GrammarExplanation = grammar.Corrected, grammar.Explanation
	}()

	wg.Wait()
	return fb
}
