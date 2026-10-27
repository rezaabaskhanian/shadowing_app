package songhandler

import (
	"net/http"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/errorhandling"
	authservice "shadowing-backend/internal/service/auth"
	songservice "shadowing-backend/internal/service/song"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc        *songservice.Service
	authSvc    authservice.Service
	authConfig authservice.Config
}

func New(svc *songservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig}
}

func (h Handler) SetSongRoutes(e *echo.Echo) {
	auth := middlware.Auth(h.authSvc, h.authConfig)

	app := e.Group("/v1/songs", auth)
	app.GET("", h.List)
	app.GET("/:id", h.Get)

	admin := e.Group("/v1/admin/songs", auth, middlware.AdminOnly)
	admin.GET("", h.AdminList)
	admin.POST("", h.AdminCreate)
	admin.GET("/:id", h.AdminGet)
	admin.PUT("/:id", h.AdminUpdate)
	admin.DELETE("/:id", h.AdminDelete)
}

func respond(c echo.Context, data any, err error) error {
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, data)
}

func (h Handler) List(c echo.Context) error {
	list, err := h.svc.List(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) Get(c echo.Context) error {
	s, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	return respond(c, s, err)
}

func (h Handler) AdminList(c echo.Context) error {
	list, err := h.svc.AdminList(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) AdminGet(c echo.Context) error {
	s, err := h.svc.AdminGet(c.Request().Context(), c.Param("id"))
	return respond(c, s, err)
}

func (h Handler) save(c echo.Context, id string) error {
	var req songservice.Song
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	s, err := h.svc.AdminSave(c.Request().Context(), id, req)
	return respond(c, s, err)
}

func (h Handler) AdminCreate(c echo.Context) error { return h.save(c, "") }
func (h Handler) AdminUpdate(c echo.Context) error { return h.save(c, c.Param("id")) }

func (h Handler) AdminDelete(c echo.Context) error {
	err := h.svc.AdminDelete(c.Request().Context(), c.Param("id"))
	return respond(c, map[string]bool{"ok": true}, err)
}
