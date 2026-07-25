package learninghandler

import "github.com/labstack/echo/v4"

// SetPublicSceneRoutes روت‌های عمومی و فقط-خواندنی صحنه‌ها را برای مصرف اپ موبایل
// ثبت می‌کند. این روت‌ها نیاز به احراز هویت ندارند چون محتوای آموزشی عمومی هستند.
func (h Handler) SetPublicSceneRoutes(e *echo.Echo) {
	// لیست همه‌ی صحنه‌ها (بدون هات‌اسپات‌ها - سبک)
	e.GET("/v1/scenes", h.ListScene)

	// یک صحنه همراه با هات‌اسپات‌ها و دیالوگ‌هایش
	e.GET("/v1/scenes/:sceneID", h.GetScene)
}
