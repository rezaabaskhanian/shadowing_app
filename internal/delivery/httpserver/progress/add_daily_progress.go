package progresshandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/progress/dto"

	"github.com/labstack/echo/v4"
)

// AddDailyProgress - ثبت تمرین روزانه
// @Summary ثبت تمرین روزانه کاربر
// @Description تمرین روزانه را ثبت و استریک و XP را به‌روزرسانی می‌کند
// @Tags Progress
// @Accept json
// @Produce json
// @Param request body dto.AddDailyProgressRequest true "اطلاعات تمرین"
// @Success 200 {object} dto.AddDailyProgressResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/progress/daily [post]
func (h *Handler) AddDailyProgress(c echo.Context) error {
	const op = "progresshandler.AddDailyProgress"

	var req dto.AddDailyProgressRequest
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
	if req.DialogueID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "dialogue_id_required",
			"message": "شناسه دیالوگ الزامی است",
		})
	}
	if req.XP <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_xp",
			"message": "امتیاز باید بیشتر از صفر باشد",
		})
	}

	// فراخوانی سرویس
	response, err := h.progressSvc.AddDailyProgress(c.Request().Context(), req)
	if err != nil {

		errorhandling.ErrorHandling(err, c)

	}

	return c.JSON(http.StatusOK, response)
}
