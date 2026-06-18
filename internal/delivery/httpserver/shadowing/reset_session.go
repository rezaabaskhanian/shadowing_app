package shadowinghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

// ResetSession - بازنشانی جلسه تمرین
// @Summary بازنشانی جلسه تمرین به مرحله اول
// @Description جلسه را به مرحله اول برمی‌گرداند
// @Tags Shadowing
// @Accept json
// @Produce json
// @Param id path string true "شناسه جلسه"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/shadowing/session/{id}/reset [post]
func (h *Handler) ResetSession(c echo.Context) error {
	const op = "shadowinghandler.ResetSession"

	sessionID := c.Param("id")
	if sessionID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "session_id_required",
			"message": "شناسه جلسه الزامی است",
		})
	}

	err := h.ShadowingSvc.ResetSession(c.Request().Context(), sessionID)
	if err != nil {
		errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "جلسه تمرین با موفقیت بازنشانی شد",
	})
}
