package adminhandler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type generateSceneRequest struct {
	Prompt     string `json:"prompt"`
	Difficulty string `json:"difficulty"`
}

// GenerateScene با یک پرامپت ساده، محتوای یک صحنه (دیالوگ‌ها + ترجمه + واژه‌ها) را
// با کمک مدل Claude تولید می‌کند و برای پرکردن فرم به پنل ادمین برمی‌گرداند.
// این مسیر مکملِ ساخت دستی است؛ چیزی در دیتابیس ذخیره نمی‌کند.
func (h Handler) GenerateScene(c echo.Context) error {
	if !h.aiSvc.Enabled() {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{
			"message": "کلید ANTHROPIC_API_KEY تنظیم نشده است",
		})
	}

	var req generateSceneRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if len(req.Prompt) < 3 {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "پرامپت خیلی کوتاه است"})
	}

	scene, err := h.aiSvc.GenerateScene(c.Request().Context(), req.Prompt, req.Difficulty)
	if err != nil {
		return c.JSON(http.StatusBadGateway, echo.Map{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, scene)
}
