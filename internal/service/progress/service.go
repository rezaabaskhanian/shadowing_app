package progressservice

import (
	"context"

	domainStreak "shadowing-backend/internal/domain/progress/streak"

	domainAchievemnt "shadowing-backend/internal/domain/progress/achievement"

	domainSceneProgress "shadowing-backend/internal/domain/progress/scene_progress"

	"github.com/google/uuid"
)

type StreakRepository interface {
	// GetByUser - دریافت استریک کاربر
	GetByUser(ctx context.Context, userID uuid.UUID) (*domainStreak.Streak, error)

	Create(ctx context.Context, streak *domainStreak.Streak) error

	Update(ctx context.Context, streak *domainStreak.Streak) error
}

// ============================================
// RecordingRepository - اینترفیس با Pointer
// ============================================
type AchievementRepository interface {
	// GetByUser - دریافت دستاوردهای کاربر
	GetByUser(ctx context.Context, userID uuid.UUID) ([]domainAchievemnt.Achievement, error)

	// Create - ایجاد دستاورد جدید
	Create(ctx context.Context, achievement *domainAchievemnt.Achievement) error

	// Exists - بررسی وجود دستاورد
	Exists(ctx context.Context, userID uuid.UUID, achType domainAchievemnt.AchievementType) (bool, error)
}

type SceneProgressRepository interface {
	Create(ctx context.Context, progress *domainSceneProgress.SceneProgress) error
	GetByUserAndScene(ctx context.Context, userID, sceneID string) (*domainSceneProgress.SceneProgress, error)
	GetByUser(ctx context.Context, userID string) ([]domainSceneProgress.SceneProgress, error)
	Update(ctx context.Context, progress *domainSceneProgress.SceneProgress) error
	GetCompletedScenes(ctx context.Context, userID string) ([]domainSceneProgress.SceneProgress, error)
}

// ============================================
// Service - با Pointer
// ============================================
type Service struct {
	streakRepo      StreakRepository
	achievementRepo AchievementRepository
	sceneProRepo    SceneProgressRepository
}

// New - سازنده با بازگشت Pointer
func New(streakRepo StreakRepository, achievementRepo AchievementRepository, sceneProRepo SceneProgressRepository) *Service {
	return &Service{
		streakRepo:      streakRepo,
		achievementRepo: achievementRepo,
		sceneProRepo:    sceneProRepo,
	}
}
