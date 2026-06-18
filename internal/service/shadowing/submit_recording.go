package shadowingservice

import (
	"context"
	domainRecording "shadowing-backend/internal/domain/shadowing/recording"
	domainSession "shadowing-backend/internal/domain/shadowing/session"

	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/shadowing/dto"

	"github.com/google/uuid"
)

// SubmitRecording - ارسال ضبط برای مرحله فعلی
func (s Service) SubmitRecording(ctx context.Context, req dto.SubmitRecordingRequest) (*dto.SubmitRecordingResponse, error) {
	const op = "shadowing.SubmitRecording"

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
	}

	// 🔟 ساخت پاسخ
	return &dto.SubmitRecordingResponse{
		RecordingID: newRecording.ID.String(),
		StepNumber:  int(currentStep.StepType),
		NextStep:    nextStep,
		IsComplete:  isComplete,
	}, nil
}
