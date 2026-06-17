package learninghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

func (h Handler) GetScene(c echo.Context) error {

	const op = "learninghandler.GetScene"
	sceneID := c.Param("sceneID")

	scene, err := h.learningSvc.GetScene(c.Request().Context(), sceneID)

	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, scene)

}
