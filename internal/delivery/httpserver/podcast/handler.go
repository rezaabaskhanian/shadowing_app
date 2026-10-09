package podcasthandler

import (
	"net/http"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/errorhandling"
	authservice "shadowing-backend/internal/service/auth"
	podcastservice "shadowing-backend/internal/service/podcast"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc        *podcastservice.Service
	authSvc    authservice.Service
	authConfig authservice.Config
}

func New(svc *podcastservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig}
}

func (h Handler) SetPodcastRoutes(e *echo.Echo) {
	auth := middlware.Auth(h.authSvc, h.authConfig)

	app := e.Group("/v1/podcasts", auth)
	app.GET("", h.List)
	app.GET("/:id", h.Get)

	admin := e.Group("/v1/admin/podcasts", auth, middlware.AdminOnly)
	admin.GET("", h.AdminList)
	admin.POST("", h.AdminCreate)
	admin.POST("/generate-script", h.AdminGenerateScript)
	admin.GET("/:id", h.AdminGet)
	admin.PUT("/:id", h.AdminUpdate)
	admin.DELETE("/:id", h.AdminDelete)
	admin.POST("/:id/generate-audio", h.AdminGenerateAudio)
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

func (h Handler) List(c echo.Context) error {
	list, err := h.svc.List(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) Get(c echo.Context) error {
	p, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	return respond(c, p, err)
}

func (h Handler) AdminList(c echo.Context) error {
	list, err := h.svc.AdminList(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) AdminGet(c echo.Context) error {
	p, err := h.svc.AdminGet(c.Request().Context(), c.Param("id"))
	return respond(c, p, err)
}

func (h Handler) save(c echo.Context, id string) error {
	var req podcastservice.Podcast
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	p, err := h.svc.AdminSave(c.Request().Context(), id, req)
	return respond(c, p, err)
}

func (h Handler) AdminCreate(c echo.Context) error { return h.save(c, "") }
func (h Handler) AdminUpdate(c echo.Context) error { return h.save(c, c.Param("id")) }

func (h Handler) AdminDelete(c echo.Context) error {
	return respond(c, echo.Map{"ok": true}, h.svc.AdminDelete(c.Request().Context(), c.Param("id")))
}

func (h Handler) AdminGenerateScript(c echo.Context) error {
	var req struct {
		Topic   string `json:"topic"`
		Scene   string `json:"scene"`
		Level   string `json:"level"`
		Minutes int    `json:"minutes"`
	}
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	res, err := h.svc.AdminGenerateScript(c.Request().Context(), req.Topic, req.Scene, req.Level, req.Minutes)
	return respond(c, res, err)
}

func (h Handler) AdminGenerateAudio(c echo.Context) error {
	p, err := h.svc.AdminGenerateAudio(c.Request().Context(), c.Param("id"))
	return respond(c, p, err)
}
