package errorhandling

import (
	"net/http"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/labstack/echo/v4"
)

func ErrorHandling(err error, c echo.Context) error {

	switch e := err.(type) {
	case richerror.RichError:
		switch e.Kind() {

		case richerror.KindInvalid:
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error":   "invalid_input",
				"message": e.Message(),
			})
		case richerror.KindNotFound:
			return c.JSON(http.StatusNotFound, map[string]string{
				"error":   "not_found",
				"message": e.Message(),
			})
		case richerror.KindForbidden:
			return c.JSON(http.StatusForbidden, map[string]string{
				"error":   "forbidden",
				"message": e.Message(),
			})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error":   "internal_error",
				"message": "خطای داخلی سرور",
			})
		}
	default:
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": err.Error(),
		})
	}

}
