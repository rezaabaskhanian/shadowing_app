package writinghandler

import (
	"net/http"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	authservice "shadowing-backend/internal/service/auth"
	writingservice "shadowing-backend/internal/service/writing"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc        *writingservice.Service
	authSvc    authservice.Service
	authConfig authservice.Config
}

func New(svc *writingservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig}
}

func (h Handler) SetWritingRoutes(e *echo.Echo) {
	auth := middlware.Auth(h.authSvc, h.authConfig)

	app := e.Group("/v1/writing", auth)
	app.GET("/prompts", h.List)
	app.POST("/prompts/:id/submit", h.Submit)

	admin := e.Group("/v1/admin/writing-prompts", auth, middlware.AdminOnly)
	admin.GET("", h.AdminList)
	admin.POST("", h.AdminCreate)
	admin.POST("/suggest", h.AdminSuggest)
	admin.PUT("/:id", h.AdminUpdate)
	admin.DELETE("/:id", h.AdminDelete)
}

func userID(c echo.Context) (string, error) {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return "", c.JSON(http.StatusUnauthorized, map[string]string{"message": "احراز هویت نامعتبر است"})
	}
	return userClaims.UserID, nil
}

func respond(c echo.Context, data any, err error) error {
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, data)
}

func (h Handler) List(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	list, err := h.svc.ListPrompts(c.Request().Context(), uid)
	return respond(c, list, err)
}

func (h Handler) Submit(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	var req struct {
		Text string `json:"text"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	res, err := h.svc.Submit(c.Request().Context(), uid, c.Param("id"), req.Text)
	return respond(c, res, err)
}

func (h Handler) AdminList(c echo.Context) error {
	list, err := h.svc.AdminList(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) save(c echo.Context, id string) error {
	var req writingservice.Prompt
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	p, err := h.svc.AdminSave(c.Request().Context(), id, req)
	return respond(c, p, err)
}

func (h Handler) AdminCreate(c echo.Context) error { return h.save(c, "") }
func (h Handler) AdminUpdate(c echo.Context) error { return h.save(c, c.Param("id")) }

func (h Handler) AdminDelete(c echo.Context) error {
	return respond(c, echo.Map{"ok": true}, h.svc.AdminDelete(c.Request().Context(), c.Param("id")))
}

func (h Handler) AdminSuggest(c echo.Context) error {
	var req struct {
		Idea  string `json:"idea"`
		Level string `json:"level"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	s, err := h.svc.AdminSuggest(c.Request().Context(), req.Idea, req.Level)
	return respond(c, s, err)
}
