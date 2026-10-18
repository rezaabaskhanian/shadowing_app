package pathhandler

import (
	"net/http"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	authservice "shadowing-backend/internal/service/auth"
	pathservice "shadowing-backend/internal/service/path"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc        *pathservice.Service
	authSvc    authservice.Service
	authConfig authservice.Config
}

func New(svc *pathservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig}
}

func (h Handler) SetPathRoutes(e *echo.Echo) {
	auth := middlware.Auth(h.authSvc, h.authConfig)

	app := e.Group("/v1/paths", auth)
	app.GET("", h.Paths)
	app.GET("/:level", h.Path)
	app.POST("/weeks/:id/items/:key/complete", h.CompleteItem)
	app.GET("/weeks/:id/checkpoint", h.Checkpoint)
	app.POST("/weeks/:id/checkpoint", h.SubmitCheckpoint)

	admin := e.Group("/v1/admin/paths", auth, middlware.AdminOnly)
	admin.GET("", h.AdminPaths)
	admin.GET("/:level", h.AdminPath)
	admin.PUT("/:level", h.AdminSavePath)
	admin.PUT("/:level/active", h.AdminSetActive)
	admin.POST("/:level/checkpoint-audio", h.AdminCheckpointAudio)
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

func badRequest(c echo.Context) error {
	return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
}

// ---------- اپ ----------

func (h Handler) Paths(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	paths, err := h.svc.Paths(c.Request().Context(), uid)
	return respond(c, paths, err)
}

func (h Handler) Path(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	p, err := h.svc.Path(c.Request().Context(), uid, c.Param("level"))
	return respond(c, p, err)
}

func (h Handler) CompleteItem(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	err = h.svc.CompleteItem(c.Request().Context(), uid, c.Param("id"), c.Param("key"))
	return respond(c, echo.Map{"ok": true}, err)
}

func (h Handler) Checkpoint(c echo.Context) error {
	cp, err := h.svc.Checkpoint(c.Request().Context(), c.Param("id"))
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSONBlob(http.StatusOK, cp)
}

func (h Handler) SubmitCheckpoint(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	var req struct {
		Scores map[string]int `json:"scores"`
	}
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	res, err := h.svc.SubmitCheckpoint(c.Request().Context(), uid, c.Param("id"), req.Scores)
	return respond(c, res, err)
}

// ---------- ادمین ----------

func (h Handler) AdminPaths(c echo.Context) error {
	paths, err := h.svc.AdminPaths(c.Request().Context())
	return respond(c, paths, err)
}

func (h Handler) AdminPath(c echo.Context) error {
	p, err := h.svc.AdminPath(c.Request().Context(), c.Param("level"))
	return respond(c, p, err)
}

func (h Handler) AdminSavePath(c echo.Context) error {
	var req pathservice.Path
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	req.Level = c.Param("level")
	p, err := h.svc.AdminSavePath(c.Request().Context(), req)
	return respond(c, p, err)
}

func (h Handler) AdminSetActive(c echo.Context) error {
	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	err := h.svc.AdminSetActive(c.Request().Context(), c.Param("level"), req.IsActive)
	return respond(c, echo.Map{"is_active": req.IsActive}, err)
}

func (h Handler) AdminCheckpointAudio(c echo.Context) error {
	var req struct {
		Voices map[string]string `json:"voices"`
	}
	_ = c.Bind(&req)
	made, err := h.svc.AdminGenerateCheckpointAudio(c.Request().Context(), c.Param("level"), req.Voices)
	if err != nil && made > 0 {
		return c.JSON(http.StatusBadGateway, echo.Map{"message": err.Error(), "made": made})
	}
	return respond(c, echo.Map{"made": made}, err)
}
