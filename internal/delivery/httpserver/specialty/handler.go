package specialtyhandler

import (
	"net/http"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/errorhandling"
	authservice "shadowing-backend/internal/service/auth"
	interviewservice "shadowing-backend/internal/service/interview"
	specialtyservice "shadowing-backend/internal/service/specialty"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc          *specialtyservice.Service
	interviewSvc *interviewservice.Service
	authSvc      authservice.Service
	authConfig   authservice.Config
}

func New(svc *specialtyservice.Service, interviewSvc *interviewservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{svc: svc, interviewSvc: interviewSvc, authSvc: authSvc, authConfig: authConfig}
}

func (h Handler) SetSpecialtyRoutes(e *echo.Echo) {
	auth := middlware.Auth(h.authSvc, h.authConfig)

	// تنظیمات عمومیِ اپ (بدون ورود): کدام بخش‌های تازه روشن‌اند. اپ با این
	// تصمیم می‌گیرد ورودیِ بخش را نشان بدهد یا نه، بدون نیاز به نسخه‌ی جدید.
	e.GET("/v1/app-config", h.AppConfig)

	app := e.Group("/v1/specialty", auth)
	app.GET("/fields", h.List)
	app.GET("/fields/:key", h.Get)

	admin := e.Group("/v1/admin/specialty", auth, middlware.AdminOnly)
	admin.GET("/fields", h.AdminList)
	admin.GET("/fields/:key", h.AdminGet)
	admin.PUT("/fields/:key", h.AdminSaveField)
	admin.DELETE("/fields/:key", h.AdminDeleteField)
	admin.PUT("/fields/:key/words", h.AdminSaveWords)
	admin.PUT("/content-field", h.AdminSetContentField)
}

func respond(c echo.Context, data any, err error) error {
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, data)
}

func (h Handler) AppConfig(c echo.Context) error {
	return c.JSON(http.StatusOK, echo.Map{
		"features": echo.Map{
			"interview": h.interviewSvc.Enabled(),
			"specialty": h.svc.Enabled(),
		},
	})
}

// ---------- اپ ----------

func (h Handler) List(c echo.Context) error {
	list, err := h.svc.ListFields(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) Get(c echo.Context) error {
	d, err := h.svc.GetField(c.Request().Context(), c.Param("key"))
	return respond(c, d, err)
}

// ---------- ادمین ----------

func (h Handler) AdminList(c echo.Context) error {
	list, err := h.svc.AdminList(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) AdminGet(c echo.Context) error {
	d, err := h.svc.AdminGet(c.Request().Context(), c.Param("key"))
	return respond(c, d, err)
}

func (h Handler) AdminSaveField(c echo.Context) error {
	var req specialtyservice.Field
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	req.Key = c.Param("key")
	d, err := h.svc.AdminSaveField(c.Request().Context(), req)
	return respond(c, d, err)
}

func (h Handler) AdminDeleteField(c echo.Context) error {
	return respond(c, echo.Map{"ok": true}, h.svc.AdminDeleteField(c.Request().Context(), c.Param("key")))
}

func (h Handler) AdminSaveWords(c echo.Context) error {
	var req struct {
		Words []specialtyservice.Word `json:"words"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	d, err := h.svc.AdminSaveWords(c.Request().Context(), c.Param("key"), req.Words)
	return respond(c, d, err)
}

func (h Handler) AdminSetContentField(c echo.Context) error {
	var req struct {
		Kind     string `json:"kind"`
		ID       string `json:"id"`
		FieldKey string `json:"field_key"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	return respond(c, echo.Map{"ok": true}, h.svc.AdminSetContentField(c.Request().Context(), req.Kind, req.ID, req.FieldKey))
}
