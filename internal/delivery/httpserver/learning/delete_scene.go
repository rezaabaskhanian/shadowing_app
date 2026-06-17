package learninghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

func (h Handler) DeleteScene(c echo.Context) error {

	const op = "learninghandler.DeleteScene"

	sceneID := c.Param("sceneID")

	err := h.learningSvc.DeleteScene(c.Request().Context(), sceneID)

	if err != nil {
		errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, map[string]string{
		"error":   "status_ok",
		"message": "درخواست با موفقیت حذف شد ",
	})

}
