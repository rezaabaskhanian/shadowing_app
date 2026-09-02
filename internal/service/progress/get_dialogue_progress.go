package progressservice

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
)

// GetDialogueProgress نمره‌ی هر دیالوگِ ضبط‌شده‌ی این کاربر در این صحنه را
// برمی‌گرداند؛ کلید = dialogueID. وجود کلید در نتیجه یعنی آن دیالوگ قبلاً
// تکمیل/ضبط شده است (برای رفع این باگ که با بازگشت به صحنه، دیالوگ‌های
// قبلاً ضبط‌شده گم به‌نظر می‌رسیدند).
func (s *Service) GetDialogueProgress(ctx context.Context, userID, sceneID string) (map[string]float64, error) {
	const op = "progress.GetDialogueProgress"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}
	sid, err := uuid.Parse(sceneID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid scene ID")
	}

	rows, err := s.sceneProRepo.GetDialogueProgress(ctx, uid, sid)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	result := make(map[string]float64, len(rows))
	for _, r := range rows {
		result[r.DialogueID.String()] = r.Score
	}
	return result, nil
}
