package analyticshandler

import (
	"net/http"
	"strconv"
	"strings"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/errorhandling"
	analyticsservice "shadowing-backend/internal/service/analytics"
	authservice "shadowing-backend/internal/service/auth"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc        analyticsservice.Service
	authSvc    authservice.Service
	authConfig authservice.Config
}

func New(svc analyticsservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig}
}

// SetAnalyticsRoutes ثبت رویداد از اپ (عمومی — نصب و اولین قدم‌ها قبل از ورود
// کاربر است) و گزارش «آمار» پنل ادمین را ثبت می‌کند.
func (h Handler) SetAnalyticsRoutes(e *echo.Echo) {
	e.POST("/v1/events", h.Track)
	e.GET("/v1/admin/analytics", h.Summary, middlware.Auth(h.authSvc, h.authConfig), middlware.AdminOnly)
}

func (h Handler) Track(c echo.Context) error {
	var req analyticsservice.TrackRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر است"})
	}
	if err := h.svc.Track(c.Request().Context(), req, h.optionalUserID(c)); err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.NoContent(http.StatusNoContent)
}

// optionalUserID اگر اپ توکن معتبر فرستاده باشد شناسه‌ی کاربر را برمی‌گرداند؛
// توکن نبودن یا منقضی بودنش خطا نیست — رویداد فقط بدون user_id ثبت می‌شود.
func (h Handler) optionalUserID(c echo.Context) string {
	token := strings.TrimSpace(strings.TrimPrefix(c.Request().Header.Get(echo.HeaderAuthorization), "Bearer "))
	if token == "" {
		return ""
	}
	claims, err := h.authSvc.ParseAccessToken(token)
	if err != nil || claims == nil {
		return ""
	}
	return claims.UserID
}

func (h Handler) Summary(c echo.Context) error {
	days, _ := strconv.Atoi(c.QueryParam("days"))
	res, err := h.svc.Summary(c.Request().Context(), days)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, res)
}
