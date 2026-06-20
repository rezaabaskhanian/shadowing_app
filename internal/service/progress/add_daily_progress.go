package progressservice

import (
	"context"
	"fmt"
	"shadowing-backend/internal/domain/progress/achievement"
	"shadowing-backend/internal/domain/progress/streak"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/progress/dto"

	"github.com/google/uuid"
)

// AddDailyProgress - ثبت تمرین روزانه کاربر
func (s *Service) AddDailyProgress(ctx context.Context, req dto.AddDailyProgressRequest) (*dto.AddDailyProgressResponse, error) {
	const op = "progress.AddDailyProgress"

	// 1️⃣ تبدیل IDها
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}

	// dialogueID, err := uuid.Parse(req.DialogueID)
	// if err != nil {
	//     return nil, richerror.New(op).WithErr(err).WithMessage("invalid dialogue ID")
	// }

	// 2️⃣ به‌روزرسانی استریک
	userStreak, err := s.streakRepo.GetByUser(ctx, userID)
	if err != nil {
		// اگر استریک وجود نداشت، جدید بساز
		userStreak, err = streak.NewStreak(userID)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		if err := s.streakRepo.Create(ctx, userStreak); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
	}

	// اضافه کردن روز جدید به استریک
	userStreak.AddDay()
	if err := s.streakRepo.Update(ctx, userStreak); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// 3️⃣ افزودن XP
	totalXP := req.XP
	// پاداش استریک
	if userStreak.Current >= 7 {
		totalXP += 10 // پاداش هفتگی
	}
	if userStreak.Current >= 30 {
		totalXP += 50 // پاداش ماهانه
	}

	// 4️⃣ بررسی دستاوردهای جدید
	var newAchievements []string

	// دستاورد: اولین تمرین
	exists, err := s.achievementRepo.Exists(ctx, userID, achievement.AchievementFirstLesson)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if !exists {
		newAchiev, err := s.unlockAchievement(ctx, userID.String(), achievement.AchievementFirstLesson)
		if err == nil {
			newAchievements = append(newAchievements, newAchiev.Name)
		}
	}

	// دستاورد: استریک ۷ روزه
	if userStreak.Current >= 7 {
		exists, err := s.achievementRepo.Exists(ctx, userID, achievement.AchievementStreak7)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		if !exists {
			newAchiev, err := s.unlockAchievement(ctx, userID.String(), achievement.AchievementStreak7)
			if err == nil {
				newAchievements = append(newAchievements, newAchiev.Name)
			}
		}
	}

	// دستاورد: استریک ۳۰ روزه
	if userStreak.Current >= 30 {
		exists, err := s.achievementRepo.Exists(ctx, userID, achievement.AchievementStreak30)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		if !exists {
			newAchiev, err := s.unlockAchievement(ctx, userID.String(), achievement.AchievementStreak30)
			if err == nil {
				newAchievements = append(newAchievements, newAchiev.Name)
			}
		}
	}

	// 5️⃣ ساخت پیام تشویقی
	message := "تمرین امروز با موفقیت ثبت شد! 🔥"
	if req.Score >= 90 {
		message = "عالی! تلفظت خیلی خوب بود! 🌟"
	} else if req.Score >= 70 {
		message = "خوب بود! کمی تمرین بیشتر کن! 💪"
	}

	if len(newAchievements) > 0 {
		message += fmt.Sprintf("\n🎉 دستاورد جدید: %s", newAchievements[0])
	}

	// 6️⃣ محاسبه سطح
	// level, levelName, xpToNext := s.calculateLevel(totalXP)
	level, _, _ := s.calculateLevel(totalXP)

	return &dto.AddDailyProgressResponse{
		Streak:          userStreak.Current,
		TotalXP:         totalXP,
		Level:           level,
		NewAchievements: newAchievements,
		Message:         message,
	}, nil
}

// calculateLevel - محاسبه سطح کاربر بر اساس XP
func (s *Service) calculateLevel(totalXP int) (int, string, int) {
	levels := []struct {
		XP   int
		Name string
	}{
		{0, "مبتدی"},
		{100, "آموزش‌دیده"},
		{300, "متوسط"},
		{600, "پیشرفته"},
		{1000, "حرفه‌ای"},
		{2000, "استاد"},
	}

	level := 1
	levelName := levels[0].Name
	xpToNext := levels[1].XP

	for i, l := range levels {
		if totalXP >= l.XP {
			level = i + 1
			levelName = l.Name
			if i+1 < len(levels) {
				xpToNext = levels[i+1].XP
			} else {
				xpToNext = 0
			}
		}
	}

	return level, levelName, xpToNext
}
