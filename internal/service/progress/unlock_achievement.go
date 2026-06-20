package progressservice

import (
	"context"
	"shadowing-backend/internal/domain/progress/achievement"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/progress/dto"

	"github.com/google/uuid"
)

// unlockAchievement - باز کردن یک دستاورد جدید (داخلی)
func (s *Service) unlockAchievement(ctx context.Context, userID string, achType achievement.AchievementType) (*dto.UnlockAchievementResponse, error) {
	const op = "progress.UnlockAchievement"

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}

	// 1️⃣ بررسی وجود دستاورد
	exists, err := s.achievementRepo.Exists(ctx, userUUID, achType)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if exists {
		return nil, richerror.New(op).WithMessage("achievement already unlocked")
	}

	// 2️⃣ ساخت دستاورد
	newAchiev, err := achievement.NewAchievement(uuid.MustParse(userID), achType)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// 3️⃣ ذخیره در دیتابیس
	if err := s.achievementRepo.Create(ctx, newAchiev); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	return &dto.UnlockAchievementResponse{
		AchievementID: newAchiev.ID.String(),
		Name:          newAchiev.Name,
		Icon:          newAchiev.Icon,
		Description:   newAchiev.Description,
		XP:            newAchiev.XP,
	}, nil
}

// UnlockAchievement - نسخه عمومی برای استفاده در Handler
func (s *Service) UnlockAchievement(ctx context.Context, req dto.UnlockAchievementRequest) (*dto.UnlockAchievementResponse, error) {
	achType := achievement.AchievementType(req.Type)
	return s.unlockAchievement(ctx, req.UserID, achType)
}
