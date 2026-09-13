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

type Service struct {
	scenes        SceneRepository
	sceneProgress SceneProgressRepository
	profiles      ProfileRepository
	skills        SkillsRepository
}

func New(scenes SceneRepository, sceneProgress SceneProgressRepository, profiles ProfileRepository, skills SkillsRepository) *Service {
	return &Service{scenes: scenes, sceneProgress: sceneProgress, profiles: profiles, skills: skills}
}
