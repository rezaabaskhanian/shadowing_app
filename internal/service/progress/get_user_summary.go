package progressservice

import (
	"context"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/progress/dto"

	"github.com/google/uuid"
)

// GetUserSummary - خلاصه پیشرفت کلی کاربر
func (s *Service) GetUserSummary(ctx context.Context, userID string) (*dto.GetUserSummaryResponse, error) {
	const op = "progress.GetUserSummary"

	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}

	// 1️⃣ دریافت استریک
	userStreak, err := s.streakRepo.GetByUser(ctx, id)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// 2️⃣ دریافت دستاوردها
	achievements, err := s.achievementRepo.GetByUser(ctx, id)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// 3️⃣ دریافت پیشرفت سناریوها
	sceneProgressList, err := s.sceneProRepo.GetByUser(ctx, id.String())
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// 4️⃣ محاسبه آمار
	totalScenes := len(sceneProgressList)
	completedScenes := 0
	totalXP := 0

	for _, sp := range sceneProgressList {
		totalXP += sp.XP
		if sp.IsCompleted {
			completedScenes++
		}
	}

	// 5️⃣ محاسبه سطح
	level, levelName, _ := s.calculateLevel(totalXP)

	// 6️⃣ محاسبه پیشرفت کلی
	overallProgress := 0
	if totalScenes > 0 {
		overallProgress = (completedScenes * 100) / totalScenes
	}

	return &dto.GetUserSummaryResponse{
		Streak:            userStreak.Current,
		TotalXP:           totalXP,
		Level:             level,
		LevelName:         levelName,
		TotalAchievements: len(achievements),
		CompletedScenes:   completedScenes,
		TotalScenes:       totalScenes,
		OverallProgress:   overallProgress,
	}, nil
}
