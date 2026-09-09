package learninghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

func (h Handler) GetScene(c echo.Context) error {

	const op = "learninghandler.GetScene"
	sceneID := c.Param("sceneID")

	scene, err := h.learningSvc.GetScene(c.Request().Context(), sceneID)

	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	// لیستِ کل صحنه‌ها را یک‌بار می‌گیریم و برای هر دو بررسی (نمونه‌ی رایگانِ
	// هر سطح + قفل ترتیبی) از همین استفاده می‌کنیم.
	allScenes, listErr := h.learningSvc.ListScene(c.Request().Context())
	isFreeSample := listErr == nil && freeSampleSceneIDs(allScenes)[scene.ID]

	locked := !isFreeSample && h.isSceneLocked(c, scene.IsLocked)
	if locked {
		// محتوای کامل (دیالوگ‌ها/هات‌اسپات‌ها) صحنه‌ی قفل را برنمی‌گردانیم —
		// وگرنه صدازدن مستقیم API قفل UI را دور می‌زد.
		return c.JSON(http.StatusForbidden, echo.Map{
			"message":   "این صحنه قفل است؛ برای دسترسی باید اشتراک فعال داشته باشید",
			"is_locked": true,
		})
	}
	scene.IsLocked = false
	scene.Progress, scene.IsCompleted = h.sceneProgressForUser(c, scene.ID)

	// قفل ترتیبی: باید کل مسیر را از اول پیمود تا بفهمیم صحنه‌ی قبلی کامل
	// شده یا نه — همان لیستی که بالاتر گرفتیم را دوباره استفاده می‌کنیم.
	if !isAdminCaller(c) && listErr == nil {
		for i := range allScenes {
			_, allScenes[i].IsCompleted = h.sceneProgressForUser(c, allScenes[i].ID)
		}
		applySequenceLock(allScenes, false)
		for _, s := range allScenes {
			if s.ID == scene.ID && s.SequenceLocked {
				return c.JSON(http.StatusForbidden, echo.Map{
					"message":         "برای باز شدن این صحنه باید صحنه‌ی قبلی در مسیر آموزشی را کامل کنی",
					"sequence_locked": true,
				})
			}
		}
	}

	dialogueScores := h.dialogueProgressForUser(c, scene.ID)
	for i := range scene.Hotspots {
		for j := range scene.Hotspots[i].Dialogues {
			d := &scene.Hotspots[i].Dialogues[j]
			if score, ok := dialogueScores[d.ID]; ok {
				d.IsCompleted = true
				d.Score = score
			}
		}
	}

	return c.JSON(http.StatusOK, scene)

}
