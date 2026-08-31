package userhandler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Refresh با گرفتن refresh token معتبر، یک جفت توکن تازه می‌سازد.
//
// بدون این روت، توکن دسترسی بعد از ۲۴ ساعت منقضی می‌شد و کاربر هر روز مجبور
// بود دوباره لاگین کند — با اینکه بک‌اند از اول refresh token هم صادر می‌کرد.
//
// عمداً بدون middlware.Auth ثبت می‌شود: در لحظه‌ی صدا زدنِ این روت، توکن
// دسترسی معمولاً منقضی شده است و خودِ refresh token اعتبارسنجی می‌شود.
func (h Handler) Refresh(c echo.Context) error {
	var req refreshRequest
	if err := c.Bind(&req); err != nil || req.RefreshToken == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "توکن تمدید ارسال نشده است"})
	}

	claims, err := h.authSvc.ParseRefreshToken(req.RefreshToken)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "توکن تمدید نامعتبر یا منقضی است"})
	}

	// کاربر را از دیتابیس می‌خوانیم نه از روی claims: اگر حساب حذف شده یا
	// نقشش عوض شده باشد، توکن تازه نباید وضعیت قدیمی را تا هفته‌ی بعد زنده
	// نگه دارد.
	user, err := h.userSvc.GetUserByIDService(claims.UserID)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "حساب کاربری یافت نشد"})
	}

	accessToken, err := h.authSvc.CreateAccessToken(user)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در تولید توکن"})
	}
	// توکن تمدید هم نو می‌شود (چرخش)، تا کاربرِ فعال هیچ‌وقت به سقف هفت‌روزه
	// نخورد و مجبور به لاگین دوباره نشود.
	refreshToken, err := h.authSvc.CreateRefreshToken(user)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در تولید توکن"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"tokens": echo.Map{
			"access_token":  accessToken,
			"refresh_token": refreshToken,
		},
	})
}
