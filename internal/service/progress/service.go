package progressservice

import (
	"context"

	domainStreak "shadowing-backend/internal/domain/progress/streak"

	domainAchievemnt "shadowing-backend/internal/domain/progress/achievement"

	domainSceneProgress "shadowing-backend/internal/domain/progress/scene_progress"
	postgresactivity "shadowing-backend/internal/repository/postgres/progress/activity"

	"github.com/google/uuid"
)

// DayActivity - فعالیت یک روز (دقیقه/تعداد جلسه)، همسان با ریپازیتوری
// (مثل الگوی UserActivity = postgresuser.UserActivityRow در سرویس user)
type DayActivity = postgresactivity.DayActivity

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
	RecordDialogueCompletion(ctx context.Context, userID, sceneID, dialogueID uuid.UUID, score float64) error
	CountCompletedDialogues(ctx context.Context, userID, sceneID uuid.UUID) (int, float64, error)
	CountTotalDialogues(ctx context.Context, sceneID uuid.UUID) (int, error)
}

// RecordingStatsRepository - میانگین نمره‌ی تلفظ/روانی گفتار کاربر از روی
// ضبط‌های واقعی شدوئینگ (برای «درصد مهارت‌ها»)
type RecordingStatsRepository interface {
	AvgScoresByUser(ctx context.Context, userID uuid.UUID) (avgPronunciation, avgFluency float64, err error)
}

// LeitnerStatsRepository - میانگین سطح لایتنر کاربر (برای مهارت Vocabulary)
type LeitnerStatsRepository interface {
	AvgLevelByUser(ctx context.Context, userID uuid.UUID) (avgLevel float64, wordCount int, err error)
}

// WeeklyActivityRepository - تجمیع فعالیت روزانه‌ی کاربر برای نمودار هفتگی
type WeeklyActivityRepository interface {
	WeeklyActivity(ctx context.Context, userID uuid.UUID) ([]DayActivity, error)
}

// ============================================
// Service - با Pointer
// ============================================
type Service struct {
	streakRepo      StreakRepository
	achievementRepo AchievementRepository
	sceneProRepo    SceneProgressRepository
	recordingRepo   RecordingStatsRepository
	leitnerRepo     LeitnerStatsRepository
	activityRepo    WeeklyActivityRepository
}

// New - سازنده با بازگشت Pointer
func New(
	streakRepo StreakRepository,
	achievementRepo AchievementRepository,
	sceneProRepo SceneProgressRepository,
	recordingRepo RecordingStatsRepository,
	leitnerRepo LeitnerStatsRepository,
	activityRepo WeeklyActivityRepository,
) *Service {
	return &Service{
		streakRepo:      streakRepo,
		achievementRepo: achievementRepo,
		sceneProRepo:    sceneProRepo,
		recordingRepo:   recordingRepo,
		leitnerRepo:     leitnerRepo,
		activityRepo:    activityRepo,
	}
}
