package userhandler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"shadowing-backend/internal/pkg/claims"
)

type changePasswordRequest struct {
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"`
}

// ChangePassword برای کاربر لاگین‌شده (پنل ادمین) رمز عبورش را عوض می‌کند؛
// برخلاف ResetPass نیاز به OTP ندارد چون کاربر با JWT معتبر احراز شده.
func (h Handler) ChangePassword(c echo.Context) error {
	var req changePasswordRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}

	if len(req.Password) < 8 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "weak_password",
			"message": "رمز عبور باید حداقل ۸ کاراکتر باشد",
		})
	}
	if req.Password != req.ConfirmPassword {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "password_mismatch",
			"message": "رمز عبور و تکرار آن مطابقت ندارند",
		})
	}

	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "لطفاً دوباره وارد شوید",
		})
	}

	if err := h.userSvc.ChangePassword(userClaims.UserID, req.Password); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "change_password_failed",
			"message": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "رمز عبور با موفقیت تغییر کرد"})
}
