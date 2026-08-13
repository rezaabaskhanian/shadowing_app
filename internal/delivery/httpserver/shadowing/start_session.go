package shadowinghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/claims"
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

	// شناسه‌ی کاربر همیشه از توکن JWT خوانده می‌شود، نه از بدنه‌ی درخواست،
	// تا کاربری نتواند به‌جای کاربر دیگری session بسازد.
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت ناموفق",
		})
	}
	req.UserID = userClaims.UserID

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
