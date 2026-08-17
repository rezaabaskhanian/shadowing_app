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

	locked := h.isSceneLocked(c, scene.IsLocked)
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

	return c.JSON(http.StatusOK, scene)

}
