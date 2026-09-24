package learninghandler

import (
	"context"

	"shadowing-backend/internal/domain/assessment"
	scene "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/pkg/claims"
	assessmentdto "shadowing-backend/internal/service/assessment/dto"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/labstack/echo/v4"
)

type speakingProfileGetter interface {
	GetProfile(ctx context.Context, userID string) (*assessmentdto.GetProfileResponse, error)
}

// userDifficulty سطح کاربر (بر اساس تست تعیین سطح) را برمی‌گرداند؛ کاربری که
// تست نداده یا لاگین نیست مبتدی حساب می‌شود.
func (h Handler) userDifficulty(c echo.Context) scene.DifficultyLevel {
	userClaims, err := claims.GetClaims(c)
	if err != nil || h.profileSvc == nil {
		return scene.DifficultyBeginner
	}
	profile, err := h.profileSvc.GetProfile(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return scene.DifficultyBeginner
	}
	return scene.DifficultyLevel(assessment.SceneDifficulty(assessment.Level(profile.Level)))
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
