package learninghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

func (h Handler) ListScene(c echo.Context) error {
	const op = "learninghandler.ListScene"

	scenes, err := h.learningSvc.ListScene(c.Request().Context())

	if err != nil {

		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, scenes)

}
