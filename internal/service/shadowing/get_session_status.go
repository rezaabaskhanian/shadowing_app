package shadowingservice

import (
	"context"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/shadowing/dto"

	"github.com/google/uuid"
)

// GetSessionStatus - دریافت وضعیت کامل جلسه
func (s Service) GetSessionStatus(ctx context.Context, sessionID string) (*dto.GetSessionStatusResponse, error) {
	const op = "shadowing.GetSessionStatus"

	id, err := uuid.Parse(sessionID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid session ID")
	}

	sess, err := s.sessionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("session not found")
	}

	// ساخت لیست مراحل
	steps := make([]dto.StepStatusDTO, len(sess.Steps))
	for i, step := range sess.Steps {
		steps[i] = dto.StepStatusDTO{
			StepNumber:  int(step.StepType),
			StepName:    step.GetDisplayName(),
			Status:      string(step.Status),
			IsCompleted: step.IsCompleted(),
		}
	}

	// ساخت پاسخ
	completedAt := ""
	if sess.CompletedAt != nil {
		completedAt = sess.CompletedAt.Format("2006-01-02T15:04:05Z")
	}

	return &dto.GetSessionStatusResponse{
		SessionID:   sess.ID.String(),
		Status:      string(sess.Status),
		CurrentStep: int(sess.CurrentStep),
		TotalSteps:  sess.TotalSteps,
		Progress:    sess.GetProgress(),
		Steps:       steps,
		StartedAt:   sess.StartedAt.Format("2006-01-02T15:04:05Z"),
		CompletedAt: &completedAt,
	}, nil
}
