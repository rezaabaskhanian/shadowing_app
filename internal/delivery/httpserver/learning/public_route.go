package learninghandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

// SetPublicSceneRoutes روت‌های فقط-خواندنی صحنه‌ها را برای مصرف اپ موبایل ثبت
// می‌کند. «Public» یعنی بیرون از گروه CRUD ادمین است، نه بدون احراز هویت —
// چون قفل‌بودن هر صحنه (اشتراک فعال یا نه) وابسته به کاربرِ درخواست‌دهنده است،
// این روت‌ها هم پشت Auth قرار گرفته‌اند (اپ موبایل همیشه بعد از لاگین این‌ها
// را صدا می‌زند، پس این محدودیت جدیدی برای مصرف‌کننده‌ی واقعی ایجاد نمی‌کند).
func (h Handler) SetPublicSceneRoutes(e *echo.Echo) {
	// لیست همه‌ی صحنه‌ها (بدون هات‌اسپات‌ها - سبک)
	e.GET("/v1/scenes", h.ListScene, middlware.Auth(h.authSvc, h.authConfig))

	// یک صحنه همراه با هات‌اسپات‌ها و دیالوگ‌هایش
	e.GET("/v1/scenes/:sceneID", h.GetScene, middlware.Auth(h.authSvc, h.authConfig))
}
