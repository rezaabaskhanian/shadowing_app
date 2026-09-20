package adminhandler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

// AIUsageReport هزینه‌ی دلاریِ واقعیِ مصرفِ AI (همه‌ی کاربرها) را برمی‌گرداند —
// مجموع کل و شکست روزانه‌ی «days» روز اخیر (پیش‌فرض ۳۰)، عیناً هم‌الگوی
// RevenueStats. برای قیمت‌گذاریِ درستِ اشتراک/تاپ‌آپ (هزینه‌ی واقعی + درصد
// سود)، نه حدس.
func (h Handler) AIUsageReport(c echo.Context) error {
	days := 30
	if v := c.QueryParam("days"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			days = n
		}
	}

	report, err := h.aiAccessSvc.Report(c.Request().Context(), days)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن گزارش هزینه‌ی AI"})
	}

	return c.JSON(http.StatusOK, report)
}
