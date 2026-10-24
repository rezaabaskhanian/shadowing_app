package learninghandler

import (
	"context"

	scene "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/labstack/echo/v4"
)

type speakingProfileGetter interface {
	EffectiveSceneLevel(ctx context.Context, userID string) (string, error)
}

// goalSceneChecker صحنه‌هایی که برنامه‌ی هدف کاربر به او داده را می‌شناسد.
type goalSceneChecker interface {
	InGoalPlan(ctx context.Context, userID, sceneID string) (bool, error)
}

// inUserGoalPlan: صحنه‌ای که خودِ «برنامه‌ی من» داده، حتی اگر سطحش بالاتر باشد، باز است.
func (h Handler) inUserGoalPlan(c echo.Context, sceneID string) bool {
	if h.goalScenes == nil {
		return false
	}
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return false
	}
	ok, err := h.goalScenes.InGoalPlan(c.Request().Context(), userClaims.UserID, sceneID)
	return err == nil && ok
}

// userDifficulty سطح مؤثر کاربر (انتخاب دستی، وگرنه نتیجه‌ی تست تعیین سطح) را
// برمی‌گرداند؛ کاربری که هیچ‌کدام را ندارد یا لاگین نیست مبتدی حساب می‌شود.
func (h Handler) userDifficulty(c echo.Context) scene.DifficultyLevel {
	userClaims, err := claims.GetClaims(c)
	if err != nil || h.profileSvc == nil {
		return scene.DifficultyBeginner
	}
	level, err := h.profileSvc.EffectiveSceneLevel(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return scene.DifficultyBeginner
	}
	return scene.DifficultyLevel(level)
}

func sceneDifficulty(s dto.Scene) scene.DifficultyLevel { return scene.DifficultyLevel(s.Difficulty) }

// filterByLevel قانون scene.FilterByLevel را روی صحنه‌های منتشرشده‌ی dto اعمال می‌کند.
func filterByLevel(published []dto.Scene, userLevel scene.DifficultyLevel) []dto.Scene {
	return scene.FilterByLevel(published, sceneDifficulty, userLevel)
}

// visibleForLevel می‌گوید آیا صحنه‌ی sceneID در بین صحنه‌های منتشرشده‌ی مجاز
// برای این سطح هست یا نه — همان قانون لیست برای درخواست تک‌صحنه، تا صدازدن
// مستقیم API محدودیت سطح را دور نزند.
func visibleForLevel(all []dto.Scene, sceneID string, userLevel scene.DifficultyLevel) bool {
	published := make([]dto.Scene, 0, len(all))
	for _, s := range all {
		if s.Status == "published" {
			published = append(published, s)
		}
	}
	for _, s := range filterByLevel(published, userLevel) {
		if s.ID == sceneID {
			return true
		}
	}
	return false
}
