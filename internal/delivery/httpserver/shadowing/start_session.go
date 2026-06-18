package shadowinghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/shadowing/dto"

	"github.com/labstack/echo/v4"
)

// StartSession - شروع جلسه تمرین جدید
// @Summary شروع جلسه تمرین شادوئینگ
// @Description یک جلسه تمرین جدید برای دیالوگ مشخص ایجاد می‌کند
// @Tags Shadowing
// @Accept json
// @Produce json
// @Param request body dto.StartSessionRequest true "اطلاعات شروع جلسه"
// @Success 201 {object} dto.StartSessionResponse
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/shadowing/session [post]
func (h *Handler) StartSession(c echo.Context) error {
	const op = "shadowinghandler.StartSession"

	var req dto.StartSessionRequest
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

	// فراخوانی سرویس
	response, err := h.ShadowingSvc.StartSession(c.Request().Context(), req)
	if err != nil {
		errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusCreated, response)
}
