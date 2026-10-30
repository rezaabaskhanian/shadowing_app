package userhandler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/richerror"
)

type updateProfileRequest struct {
	Nickname string `json:"nickname"`
}

// UpdateProfile ویرایش پروفایل از اپ موبایل؛ فعلاً فقط نام نمایشی.
func (h Handler) UpdateProfile(c echo.Context) error {
	var req updateProfileRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}

	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "لطفاً دوباره وارد شوید",
		})
	}

	res, err := h.userSvc.UpdateProfile(c.Request().Context(), userClaims.UserID, req.Nickname)
	if err != nil {
		if re, ok := err.(richerror.RichError); ok && re.Kind() == richerror.KindInvalid {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error":   "invalid_nickname",
				"message": re.Message(),
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "update_profile_failed",
			"message": "ذخیره‌ی پروفایل انجام نشد",
		})
	}

	return c.JSON(http.StatusOK, res)
}
