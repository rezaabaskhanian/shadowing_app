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

	// صحنه‌ی منتشرنشده برای کاربر عادی وجود ندارد.
	if scene.Status != "published" && !isAdminCaller(c) {
		return c.JSON(http.StatusNotFound, echo.Map{
			"message": "صحنه پیدا نشد",
		})
	}

	// لیستِ کل صحنه‌ها برای تشخیص نمونه‌ی رایگانِ هر سطح.
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
