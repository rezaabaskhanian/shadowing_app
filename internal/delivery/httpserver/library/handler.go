package libraryhandler

import (
	"net/http"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/errorhandling"
	authservice "shadowing-backend/internal/service/auth"
	libraryservice "shadowing-backend/internal/service/library"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc        *libraryservice.Service
	authSvc    authservice.Service
	authConfig authservice.Config
}

func New(svc *libraryservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig}
}

func (h Handler) SetLibraryRoutes(e *echo.Echo) {
	auth := middlware.Auth(h.authSvc, h.authConfig)

	// کتابخانه‌ی محتوا (فایل‌های JSON مرجع، مثل درس‌های آماده)
	res := e.Group("/v1/admin/resources", auth, middlware.AdminOnly)
	res.GET("", h.ListResources)
	res.GET("/:id", h.GetResource)
	res.POST("", h.CreateResource)
	res.PUT("/:id", h.UpdateResource)
	res.DELETE("/:id", h.DeleteResource)

	// اصطلاحات: تکی، وارد کردن گروهی (JSON یا متن چندخطی)، حذف گروهی
	idioms := e.Group("/v1/admin/idioms", auth, middlware.AdminOnly)
	idioms.GET("", h.ListIdioms)
	idioms.POST("", h.CreateIdiom)
	idioms.POST("/import", h.ImportIdioms)
	idioms.POST("/delete", h.DeleteIdioms)
	idioms.PUT("/:id", h.UpdateIdiom)
	idioms.DELETE("/:id", h.DeleteIdiom)
}

func respond(c echo.Context, data any, err error) error {
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, data)
}

func badRequest(c echo.Context) error {
	return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
}

// ---------- کتابخانه‌ی محتوا ----------

func (h Handler) ListResources(c echo.Context) error {
	list, err := h.svc.ListResources(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) GetResource(c echo.Context) error {
	r, err := h.svc.GetResource(c.Request().Context(), c.Param("id"))
	return respond(c, r, err)
}

func (h Handler) saveResource(c echo.Context, id string) error {
	var req libraryservice.Resource
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	r, err := h.svc.SaveResource(c.Request().Context(), id, req)
	return respond(c, r, err)
}

func (h Handler) CreateResource(c echo.Context) error { return h.saveResource(c, "") }
func (h Handler) UpdateResource(c echo.Context) error { return h.saveResource(c, c.Param("id")) }

func (h Handler) DeleteResource(c echo.Context) error {
	return respond(c, echo.Map{"ok": true}, h.svc.DeleteResource(c.Request().Context(), c.Param("id")))
}

// ---------- اصطلاحات ----------

func (h Handler) ListIdioms(c echo.Context) error {
	list, err := h.svc.ListIdioms(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) saveIdiom(c echo.Context, id string) error {
	var req libraryservice.Idiom
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	i, err := h.svc.SaveIdiom(c.Request().Context(), id, req)
	return respond(c, i, err)
}

func (h Handler) CreateIdiom(c echo.Context) error { return h.saveIdiom(c, "") }
func (h Handler) UpdateIdiom(c echo.Context) error { return h.saveIdiom(c, c.Param("id")) }

func (h Handler) DeleteIdiom(c echo.Context) error {
	return respond(c, echo.Map{"ok": true}, h.svc.DeleteIdioms(c.Request().Context(), []string{c.Param("id")}))
}

func (h Handler) DeleteIdioms(c echo.Context) error {
	var req struct {
		IDs []string `json:"ids"`
	}
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	return respond(c, echo.Map{"ok": true}, h.svc.DeleteIdioms(c.Request().Context(), req.IDs))
}

func (h Handler) ImportIdioms(c echo.Context) error {
	var req struct {
		Items     []libraryservice.Idiom `json:"items"`
		Overwrite bool                   `json:"overwrite"`
	}
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	res, err := h.svc.ImportIdioms(c.Request().Context(), req.Items, req.Overwrite)
	return respond(c, res, err)
}
