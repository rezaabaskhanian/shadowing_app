package progressservice

import (
	"context"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/progress/dto"

	"github.com/google/uuid"
)

// GetUserAchievements - دریافت دستاوردهای کاربر
func (s *Service) GetUserAchievements(ctx context.Context, userID string) (*dto.GetUserAchievementsResponse, error) {
	const op = "progress.GetUserAchievements"

	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}

	achievements, err := s.achievementRepo.GetByUser(ctx, id)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	result := &dto.GetUserAchievementsResponse{
		Achievements: []dto.AchievementDTO{},
		Total:        len(achievements),
	}

	for _, ach := range achievements {
		unlockedAt := ""
		if ach.UnlockedAt != nil {
			unlockedAt = ach.UnlockedAt.Format("2006-01-02T15:04:05Z")
		}

		result.Achievements = append(result.Achievements, dto.AchievementDTO{
			ID:          ach.ID.String(),
			Name:        ach.Name,
			Description: ach.Description,
			Icon:        ach.Icon,
			Rarity:      string(ach.Rarity),
			XP:          ach.XP,
			UnlockedAt:  unlockedAt,
		})
	}

	return result, nil
}
