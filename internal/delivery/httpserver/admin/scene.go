package adminhandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/labstack/echo/v4"
)

// CreateScene یک صحنه‌ی جدید همراه با هات‌اسپات‌های تعیین‌شده توسط ادمین می‌سازد.
func (h Handler) CreateScene(c echo.Context) error {
	var req dto.CreateSceneRequest

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	scene, err := h.learningSvc.CreateScene(c.Request().Context(), req)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusCreated, scene)
}

// ListScenes همه‌ی صحنه‌ها را برای نمایش در پنل برمی‌گرداند.
func (h Handler) ListScenes(c echo.Context) error {
	scenes, err := h.learningSvc.ListScene(c.Request().Context())
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, scenes)
}

// GetScene یک صحنه را همراه با هات‌اسپات‌هایش برمی‌گرداند.
func (h Handler) GetScene(c echo.Context) error {
	sceneID := c.Param("sceneID")

	scene, err := h.learningSvc.GetScene(c.Request().Context(), sceneID)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, scene)
}

// DeleteScene یک صحنه را حذف می‌کند.
func (h Handler) DeleteScene(c echo.Context) error {
	sceneID := c.Param("sceneID")

	if err := h.learningSvc.DeleteScene(c.Request().Context(), sceneID); err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "صحنه با موفقیت حذف شد",
	})
}
