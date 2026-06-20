package progressservice

import (
	"context"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/progress/dto"

	"github.com/google/uuid"
)

// GetUserStreak - دریافت استریک کاربر
func (s *Service) GetUserStreak(ctx context.Context, userID string) (*dto.GetUserStreakResponse, error) {
	const op = "progress.GetUserStreak"

	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}

	userStreak, err := s.streakRepo.GetByUser(ctx, id)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("streak not found")
	}

	// محاسبه استریک بعدی (برای نمایش به کاربر)
	nextMilestone := 0
	if userStreak.Current < 7 {
		nextMilestone = 7
	} else if userStreak.Current < 30 {
		nextMilestone = 30
	} else if userStreak.Current < 100 {
		nextMilestone = 100
	}

	return &dto.GetUserStreakResponse{
		CurrentStreak: userStreak.Current,
		LongestStreak: userStreak.Longest,
		Freezes:       userStreak.Freezes,
		Status:        string(userStreak.Status),
		NextMilestone: nextMilestone,
	}, nil
}
