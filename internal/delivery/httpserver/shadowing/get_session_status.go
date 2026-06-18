package shadowinghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

// GetSessionStatus - دریافت وضعیت کامل جلسه
// @Summary دریافت وضعیت کامل جلسه تمرین
// @Description اطلاعات کامل جلسه شامل همه مراحل را برمی‌گرداند
// @Tags Shadowing
// @Accept json
// @Produce json
// @Param id path string true "شناسه جلسه"
// @Success 200 {object} dto.GetSessionStatusResponse
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/shadowing/session/{id}/status [get]
func (h *Handler) GetSessionStatus(c echo.Context) error {
	const op = "shadowinghandler.GetSessionStatus"

	sessionID := c.Param("id")
	if sessionID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "session_id_required",
			"message": "شناسه جلسه الزامی است",
		})
	}

	response, err := h.ShadowingSvc.GetSessionStatus(c.Request().Context(), sessionID)
	if err != nil {
		errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, response)
}
