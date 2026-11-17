package adminhandler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type startPocRequest struct {
	Model string `json:"model"` // "kling" or "minimax"
}

// StartCinematicPoc شروع اجرای تست ۵ ثانیه‌ای فاز ۱ در پس‌زمینه
func (h Handler) StartCinematicPoc(c echo.Context) error {
	if h.cinematicReelSvc == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"message": "سرویس ریلز سینمایی فعال نیست"})
	}

	var req startPocRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر است"})
	}

	if req.Model == "" {
		req.Model = "kling"
	}

	poc, err := h.cinematicReelSvc.StartPocTest(req.Model)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, poc)
}

// GetCinematicPocStatus دریافت آخرین وضعیت و درصد پیشرفت و نتیجه ویدیو
func (h Handler) GetCinematicPocStatus(c echo.Context) error {
	if h.cinematicReelSvc == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"message": "سرویس ریلز سینمایی فعال نیست"})
	}

	status := h.cinematicReelSvc.GetCurrentPoc()
	return c.JSON(http.StatusOK, status)
}

