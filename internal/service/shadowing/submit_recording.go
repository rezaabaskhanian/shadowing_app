package shadowingservice

import (
	"context"
	"log/slog"
	"os"

	domainRecording "shadowing-backend/internal/domain/shadowing/recording"
	domainSession "shadowing-backend/internal/domain/shadowing/session"

	"shadowing-backend/internal/pkg/richerror"
	progressdto "shadowing-backend/internal/service/progress/dto"
	"shadowing-backend/internal/service/shadowing/dto"
	"shadowing-backend/internal/service/speecheval"

	"github.com/google/uuid"
)

// SubmitRecording - ارسال ضبط برای مرحله فعلی
func (s Service) SubmitRecording(ctx context.Context, req dto.SubmitRecordingRequest) (*dto.SubmitRecordingResponse, error) {
	const op = "shadowing.SubmitRecording"

	// فایل صوتی فقط برای نمره‌دهی به سرور می‌آید؛ در هر مسیر خروجی (چه موفق و
	// چه خطا) پاک می‌شود. نسخه‌ی اصلی روی گوشی کاربر می‌ماند.
	if req.LocalAudioPath != "" {
		defer func() {
			if err := os.Remove(req.LocalAudioPath); err != nil && !os.IsNotExist(err) {
				slog.Warn("could not remove temporary recording", "path", req.LocalAudioPath, "err", err)
			}
		}()
	}

	// 1️⃣ تبدیل ID
	sessionID, err := uuid.Parse(req.SessionID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid session ID")
	}

	// 2️⃣ دریافت جلسه
	sess, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("session not found")
	}

	// 3️⃣ دریافت مرحله جاری
	currentStep, err := sess.GetCurrentStep()
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// 4️⃣ بررسی اینکه مرحله قابل ضبط است (مراحل ۲ و ۳)
	if currentStep.StepType != domainSession.StepShadow && currentStep.StepType != domainSession.StepRecord {
		return nil, richerror.New(op).
			WithMessage("recording is not allowed for this step").
			WithKind(richerror.KindInvalid)
	}

	// 5️⃣ تعیین نوع ضبط
	var recType domainRecording.RecordingType
	switch currentStep.StepType {
	case domainSession.StepShadow:
		recType = domainRecording.RecordingTypeShadow
	case domainSession.StepRecord:
		recType = domainRecording.RecordingTypeRecord
	}

	// ارزیابی تلفظ و روانی گفتار از روی صدای واقعی کاربر
	evalResult := s.evaluator.Evaluate(ctx, speecheval.Input{
		TargetText:              currentStep.DisplayText,
		AudioPath:               req.LocalAudioPath,
		DurationSeconds:         req.Duration,
		ExpectedDurationSeconds: req.ExpectedDuration,
	})

	// 6️⃣ ذخیره ضبط
	newRecording, err := domainRecording.NewRecording(
		sess.UserID,
		sess.ID,
		sess.DialogueID,
		int(currentStep.StepType),
		recType,
		req.AudioPath,
		req.Duration,
	)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	newRecording.PronunciationScore = evalResult.PronunciationScore
	newRecording.FluencyScore = evalResult.FluencyScore
	newRecording.OverallScore = evalResult.OverallScore
	newRecording.Transcript = evalResult.Transcript
	newRecording.IsEstimated = evalResult.Estimated
	newRecording.WordScores = toDomainWordScores(evalResult.Words)

	if err := s.recordingRepo.Create(ctx, newRecording); err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("failed to save recording")
	}

	// 7️⃣ تکمیل مرحله فعلی
	if err := currentStep.Complete(); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// 8️⃣ به‌روزرسانی جلسه
	if err := s.sessionRepo.Update(ctx, sess); err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("failed to update session")
	}

	// 9️⃣ تعیین مرحله بعدی
	nextStep := int(sess.CurrentStep) + 1
	isComplete := false

	if sess.CurrentStep == domainSession.StepRepeat {
		// اگر در مرحله آخر بودیم، جلسه کامل می‌شود
		if err := sess.Complete(); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		if err := s.sessionRepo.Update(ctx, sess); err != nil {
			return nil, richerror.New(op).WithErr(err).WithMessage("failed to complete session")
		}
		isComplete = true
		nextStep = 0

		// ثبت پیشرفت صحنه: خطای این مرحله جریان اصلی شدوئینگ را خراب نمی‌کند،
		// فقط لاگ می‌شود — کاربر نباید به‌خاطر یک مشکل جانبی در ثبت پیشرفت،
		// نتواند تمرینش را کامل کند.
		if s.progressSvc != nil {
			if _, err := s.progressSvc.RecordDialogueProgress(
				ctx, sess.UserID.String(), sess.SceneID.String(), sess.DialogueID.String(), evalResult.OverallScore,
			); err != nil {
				slog.Warn("shadowing: failed to record scene progress", "err", err)
			}

			// استریک روزانه: قبلاً فقط ماموریت‌های عادت زبانی این را آپدیت
			// می‌کردند؛ تمرین معمولی صحنه‌ها هم باید حساب شود. AddDay در خودِ
			// استریک idempotent است (چند بار در یک روز فرقی نمی‌کند)، پس امن
			// است این را روی هر دیالوگ کامل‌شده صدا بزنیم.
			xp := 10
			if evalResult.OverallScore >= 50 {
				xp = 20
			}
			if _, err := s.progressSvc.AddDailyProgress(ctx, progressdto.AddDailyProgressRequest{
				UserID:     sess.UserID.String(),
				DialogueID: sess.DialogueID.String(),
				Score:      evalResult.OverallScore,
				XP:         xp,
			}); err != nil {
				slog.Warn("shadowing: failed to record daily streak", "err", err)
			}
		}
	}

	// 🔟 ساخت پاسخ
	return &dto.SubmitRecordingResponse{
		RecordingID:        newRecording.ID.String(),
		StepNumber:         int(currentStep.StepType),
		NextStep:           nextStep,
		IsComplete:         isComplete,
		PronunciationScore: evalResult.PronunciationScore,
		FluencyScore:       evalResult.FluencyScore,
		OverallScore:       evalResult.OverallScore,
		Transcript:         evalResult.Transcript,
		IsEstimated:        evalResult.Estimated,
		Words:              toDTOWordScores(evalResult.Words),
	}, nil
}

func toDomainWordScores(words []speecheval.WordScore) []domainRecording.WordScore {
	out := make([]domainRecording.WordScore, 0, len(words))
	for _, w := range words {
		out = append(out, domainRecording.WordScore{
			Word:   w.Word,
			Index:  w.Index,
			Score:  w.Score,
			Status: string(w.Status),
			Heard:  w.Heard,
		})
	}
	return out
}

func toDTOWordScores(words []speecheval.WordScore) []dto.WordScore {
	out := make([]dto.WordScore, 0, len(words))
	for _, w := range words {
		out = append(out, dto.WordScore{
			Word:   w.Word,
			Index:  w.Index,
			Score:  w.Score,
			Status: string(w.Status),
			Heard:  w.Heard,
		})
	}
	return out
}
