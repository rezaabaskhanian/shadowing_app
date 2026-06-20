package progresshandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/progress/dto"

	"github.com/labstack/echo/v4"
)

// UnlockAchievement - باز کردن دستاورد جدید
// @Summary باز کردن یک دستاورد جدید
// @Description یک دستاورد جدید برای کاربر باز می‌کند
// @Tags Progress
// @Accept json
// @Produce json
// @Param request body dto.UnlockAchievementRequest true "اطلاعات دستاورد"
// @Success 200 {object} dto.UnlockAchievementResponse
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/progress/achievement/unlock [post]
func (h *Handler) UnlockAchievement(c echo.Context) error {
	const op = "progresshandler.UnlockAchievement"

	var req dto.UnlockAchievementRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	// اعتبارسنجی اولیه
	if req.UserID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "user_id_required",
			"message": "شناسه کاربر الزامی است",
		})
	}
	if req.Type == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "type_required",
			"message": "نوع دستاورد الزامی است",
		})
	}

	// فراخوانی سرویس
	response, err := h.progressSvc.UnlockAchievement(c.Request().Context(), req)
	if err != nil {
		errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, response)
}
