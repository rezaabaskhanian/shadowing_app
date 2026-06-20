package progresshandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

// GetUserStreak - دریافت استریک کاربر
// @Summary دریافت استریک روزانه کاربر
// @Description استریک فعلی و طولانی‌ترین استریک کاربر را برمی‌گرداند
// @Tags Progress
// @Accept json
// @Produce json
// @Param userID path string true "شناسه کاربر"
// @Success 200 {object} dto.GetUserStreakResponse
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/progress/streak/{userID} [get]
func (h *Handler) GetUserStreak(c echo.Context) error {
	const op = "progresshandler.GetUserStreak"

	userID := c.Param("userID")
	if userID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "user_id_required",
			"message": "شناسه کاربر الزامی است",
		})
	}

	response, err := h.progressSvc.GetUserStreak(c.Request().Context(), userID)
	if err != nil {
		errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}
