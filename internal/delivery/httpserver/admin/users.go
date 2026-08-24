package adminhandler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

// updateUserRoleRequest بدنه‌ی درخواست تغییر نقش کاربر (ارتقا/برگرداندن از ادمین).
type updateUserRoleRequest struct {
	Role string `json:"role"`
}

// UpdateUserRole نقش یک کاربر را تغییر می‌دهد — برای دکمه‌ی «ارتقا به ادمین» در
// صفحه‌ی کاربران پنل ادمین. مقدار role باید «admin» یا «user» باشد.
func (h Handler) UpdateUserRole(c echo.Context) error {
	userID := c.Param("id")

	var req updateUserRoleRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر است"})
	}

	if req.Role != "admin" && req.Role != "user" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "نقش باید admin یا user باشد"})
	}

	if err := h.userSvc.UpdateRole(c.Request().Context(), userID, req.Role); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در تغییر نقش کاربر"})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "نقش کاربر با موفقیت تغییر کرد"})
}

// ListUsers فهرست کاربرها را همراه با خلاصه‌ی فعالیتشون (امتیاز، استریک،
// تعداد صحنه‌ی تکمیل‌شده، آخرین فعالیت، وضعیت اشتراک) برمی‌گرداند — برای
// صفحه‌ی «کاربران» پنل ادمین.
func (h Handler) ListUsers(c echo.Context) error {
	limit, err := strconv.Atoi(c.QueryParam("limit"))
	if err != nil || limit <= 0 || limit > 200 {
		limit = 50
	}
	offset, err := strconv.Atoi(c.QueryParam("offset"))
	if err != nil || offset < 0 {
		offset = 0
	}
	search := c.QueryParam("search")

	rows, total, err := h.userSvc.ListUsersWithActivity(c.Request().Context(), limit, offset, search)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن لیست کاربران"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"users":  rows,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}
