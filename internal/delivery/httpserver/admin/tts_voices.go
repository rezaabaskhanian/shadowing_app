package adminhandler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// ListTTSVoices صداهای در دسترسِ provider فعال TTS را برمی‌گرداند تا در پنل
// بشود بین صدای مرد/زن/لهجه‌های مختلف برای هر دیالوگ انتخاب کرد.
func (h Handler) ListTTSVoices(c echo.Context) error {
	if !h.ttsSvc.Enabled() {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{
			"message": h.ttsSvc.MissingKeyMessage(),
		})
	}

	voices, err := h.ttsSvc.ListVoices(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusBadGateway, echo.Map{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"voices": voices})
}
