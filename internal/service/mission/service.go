package missionservice

import (
	"context"

	"shadowing-backend/internal/domain/assessment"
	scene "shadowing-backend/internal/domain/learning/scene"
	sceneprogress "shadowing-backend/internal/domain/progress/scene_progress"

	"github.com/google/uuid"
)

// SceneRepository فقط GetAll لازم است — فیلترِ published/unlocked داخل خودِ
// سرویس انجام می‌شود چون پیاده‌سازیِ GetPublished در ریپازیتوریِ صحنه هنوز
// panic("unimplemented") است و هیچ‌جای دیگری هم صدا زده نمی‌شود.
type SceneRepository interface {
	GetAll(ctx context.Context) ([]scene.Scene, error)
}

type SceneProgressRepository interface {
	GetByUser(ctx context.Context, userID string) ([]sceneprogress.SceneProgress, error)
	CountTotalDialogues(ctx context.Context, sceneID uuid.UUID) (int, error)
}

type ProfileRepository interface {
	GetByUser(ctx context.Context, userID uuid.UUID) (*assessment.SpeakingProfile, error)
}

// SkillsRepository همان اینترفیسی است که progressservice برای GetSkillsBreakdown
// استفاده می‌کند — همان نمونه‌ی موجود دوباره تزریق می‌شود، ریپازیتوری جدیدی
// ساخته نمی‌شود.
type SkillsRepository interface {
	AvgScoresByUser(ctx context.Context, userID uuid.UUID) (avgPronunciation, avgFluency float64, err error)
}

// LeitnerRepository همان اینترفیسی است که progressservice برای مهارت
// Vocabulary در GetSkillsBreakdown استفاده می‌کند — دوباره تزریق می‌شود تا
// focusSkill هم Vocabulary را در نظر بگیرد.
type LeitnerRepository interface {
	AvgLevelByUser(ctx context.Context, userID uuid.UUID) (avgLevel float64, wordCount int, err error)
}

// GrammarRepository همان اینترفیسی است که progressservice برای مهارت
// Grammar در GetSkillsBreakdown استفاده می‌کند — دوباره تزریق می‌شود تا
// focusSkill هم Grammar را در نظر بگیرد.
type GrammarRepository interface {
	CleanRate(ctx context.Context, userID uuid.UUID) (clean, total int, err error)
}

// GoalRepository هدف یادگیریِ اختیاریِ کاربر را می‌خواند (تنظیم‌شده از
// Drawer/Settings، ذخیره‌شده در همان جدولِ user_notification_settings).
// طبق تصمیمِ محصولی صریح، این فقط برای اولویت‌دهیِ نرم به انتخاب صحنه
// استفاده می‌شود — هرگز فیلتر سخت/exclusion.
type GoalRepository interface {
	GetLearningGoal(ctx context.Context, userID string) (string, error)
}

// LevelOverrideRepository سطحی که کاربر دستی انتخاب کرده (رشته‌ی خالی = ندارد)؛
// بر نتیجه‌ی تست تعیین سطح اولویت دارد.
type LevelOverrideRepository interface {
	Get(ctx context.Context, userID uuid.UUID) (string, error)
}

type Service struct {
	scenes        SceneRepository
	sceneProgress SceneProgressRepository
	profiles      ProfileRepository
	skills        SkillsRepository
	leitner       LeitnerRepository
	grammar       GrammarRepository
	goals         GoalRepository
	overrides     LevelOverrideRepository
}

func New(
	scenes SceneRepository,
	sceneProgress SceneProgressRepository,
	profiles ProfileRepository,
	skills SkillsRepository,
	leitner LeitnerRepository,
	grammar GrammarRepository,
	goals GoalRepository,
	overrides LevelOverrideRepository,
) *Service {
	return &Service{
		scenes:        scenes,
		sceneProgress: sceneProgress,
		profiles:      profiles,
		skills:        skills,
		leitner:       leitner,
		grammar:       grammar,
		goals:         goals,
		overrides:     overrides,
	}
}
