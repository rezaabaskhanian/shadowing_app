package progresshandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

// GetUserSummary - خلاصه پیشرفت کلی کاربر
// @Summary دریافت خلاصه پیشرفت کلی کاربر
// @Description خلاصه کامل پیشرفت کاربر شامل استریک، XP، سطح و دستاوردها
// @Tags Progress
// @Accept json
// @Produce json
// @Param userID path string true "شناسه کاربر"
// @Success 200 {object} dto.GetUserSummaryResponse
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/progress/summary/{userID} [get]
func (h *Handler) GetUserSummary(c echo.Context) error {
	const op = "progresshandler.GetUserSummary"

	userID := c.Param("userID")
	if userID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "user_id_required",
			"message": "شناسه کاربر الزامی است",
		})
	}

	response, err := h.progressSvc.GetUserSummary(c.Request().Context(), userID)
	if err != nil {
		errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, response)
}
