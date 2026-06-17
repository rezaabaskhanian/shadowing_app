package learninghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/labstack/echo/v4"
)

func (h Handler) UpdateScene(c echo.Context) error {

	const op = "learninghandler.UpdateScene"
	var req dto.Scene

	if err := c.Bind(&req); err != nil {

		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	err := h.learningSvc.UpdateScene(c.Request().Context(), req)

	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, map[string]string{
		"error":   "status_ok",
		"message": "درخواست با موفقیت آپدیت شد",
	})

}
