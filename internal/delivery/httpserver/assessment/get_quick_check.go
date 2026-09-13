package assessmenthandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

// GetTest - سه آیتم تست تعیین سطح (رندوم از استخرهای پنل ادمین)
func (h *Handler) GetTest(c echo.Context) error {
	response, err := h.assessmentSvc.GetTest(c.Request().Context())
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}
