package adminhandler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

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
