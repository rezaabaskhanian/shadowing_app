package shadowingservice

import (
	"context"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/shadowing/dto"

	"github.com/google/uuid"
)

// GetCurrentStep - دریافت اطلاعات مرحله جاری
func (s Service) GetCurrentStep(ctx context.Context, sessionID string) (*dto.GetCurrentStepResponse, error) {
	const op = "shadowing.GetCurrentStep"

	// 1️⃣ تبدیل ID
	id, err := uuid.Parse(sessionID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid session ID")
	}

	// 2️⃣ دریافت جلسه
	sess, err := s.sessionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("session not found")
	}

	// 3️⃣ دریافت مرحله جاری
	currentStep, err := sess.GetCurrentStep()
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// 4️⃣ ساخت پاسخ
	return &dto.GetCurrentStepResponse{
		StepNumber:  int(currentStep.StepType),
		StepName:    currentStep.GetDisplayName(),
		Description: currentStep.GetDescription(),
		DisplayText: currentStep.DisplayText,
		Translation: currentStep.Translation,
		AudioURL:    currentStep.AudioURL,
		IsCompleted: currentStep.IsCompleted(),
	}, nil
}
