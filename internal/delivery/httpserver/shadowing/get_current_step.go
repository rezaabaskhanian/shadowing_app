package shadowinghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

// GetCurrentStep - دریافت اطلاعات مرحله جاری
// @Summary دریافت مرحله جاری تمرین
// @Description اطلاعات مرحله فعلی جلسه تمرین را برمی‌گرداند
// @Tags Shadowing
// @Accept json
// @Produce json
// @Param id path string true "شناسه جلسه"
// @Success 200 {object} dto.GetCurrentStepResponse
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/shadowing/session/{id}/step [get]
func (h *Handler) GetCurrentStep(c echo.Context) error {
	const op = "shadowinghandler.GetCurrentStep"

	sessionID := c.Param("id")
	if sessionID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "session_id_required",
			"message": "شناسه جلسه الزامی است",
		})
	}

	response, err := h.ShadowingSvc.GetCurrentStep(c.Request().Context(), sessionID)
	if err != nil {
		errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, response)
}
