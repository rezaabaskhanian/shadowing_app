package coursehandler

import (
	"net/http"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	authservice "shadowing-backend/internal/service/auth"
	courseservice "shadowing-backend/internal/service/course"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc        *courseservice.Service
	authSvc    authservice.Service
	authConfig authservice.Config
}

func New(svc *courseservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig}
}

func (h Handler) SetCourseRoutes(e *echo.Echo) {
	auth := middlware.Auth(h.authSvc, h.authConfig)

	app := e.Group("/v1/course", auth)
	app.GET("", h.Course)
	app.GET("/lessons/:id", h.Lesson)
	app.POST("/lessons/:id/complete", h.Complete)

	admin := e.Group("/v1/admin/course", auth, middlware.AdminOnly)
	admin.GET("", h.AdminTree)
	admin.POST("/units", h.AdminCreateUnit)
	admin.PUT("/units/:id", h.AdminUpdateUnit)
	admin.DELETE("/units/:id", h.AdminDeleteUnit)
	admin.POST("/lessons", h.AdminCreateLesson)
	admin.POST("/suggest", h.AdminSuggest)
	admin.GET("/lessons/:id", h.AdminLesson)
	admin.PUT("/lessons/:id", h.AdminUpdateLesson)
	admin.DELETE("/lessons/:id", h.AdminDeleteLesson)
	admin.POST("/lessons/:id/generate-audio", h.AdminGenerateAudio)
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

func (h Handler) Course(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	units, err := h.svc.Course(c.Request().Context(), uid)
	return respond(c, units, err)
}

func (h Handler) Lesson(c echo.Context) error {
	l, err := h.svc.Lesson(c.Request().Context(), c.Param("id"))
	return respond(c, l, err)
}

func (h Handler) Complete(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	var req struct {
		Score int `json:"score"`
	}
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	stars, err := h.svc.Complete(c.Request().Context(), uid, c.Param("id"), req.Score)
	return respond(c, echo.Map{"stars": stars}, err)
}

// ---------- ادمین ----------

func (h Handler) AdminTree(c echo.Context) error {
	units, err := h.svc.AdminTree(c.Request().Context())
	return respond(c, units, err)
}

func (h Handler) saveUnit(c echo.Context, id string) error {
	var req courseservice.Unit
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	savedID, err := h.svc.AdminSaveUnit(c.Request().Context(), id, req)
	return respond(c, echo.Map{"id": savedID}, err)
}

func (h Handler) AdminCreateUnit(c echo.Context) error { return h.saveUnit(c, "") }
func (h Handler) AdminUpdateUnit(c echo.Context) error { return h.saveUnit(c, c.Param("id")) }

func (h Handler) AdminDeleteUnit(c echo.Context) error {
	return respond(c, echo.Map{"ok": true}, h.svc.AdminDeleteUnit(c.Request().Context(), c.Param("id")))
}

func (h Handler) AdminLesson(c echo.Context) error {
	l, err := h.svc.AdminLesson(c.Request().Context(), c.Param("id"))
	return respond(c, l, err)
}

func (h Handler) saveLesson(c echo.Context, id string) error {
	var req courseservice.Lesson
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	l, err := h.svc.AdminSaveLesson(c.Request().Context(), id, req)
	return respond(c, l, err)
}

func (h Handler) AdminCreateLesson(c echo.Context) error { return h.saveLesson(c, "") }
func (h Handler) AdminUpdateLesson(c echo.Context) error { return h.saveLesson(c, c.Param("id")) }

func (h Handler) AdminDeleteLesson(c echo.Context) error {
	return respond(c, echo.Map{"ok": true}, h.svc.AdminDeleteLesson(c.Request().Context(), c.Param("id")))
}

func (h Handler) AdminSuggest(c echo.Context) error {
	var req struct {
		Topic string `json:"topic"`
		Unit  string `json:"unit"`
		Count int    `json:"count"`
	}
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	res, err := h.svc.AdminSuggest(c.Request().Context(), req.Topic, req.Unit, req.Count)
	return respond(c, res, err)
}

func (h Handler) AdminGenerateAudio(c echo.Context) error {
	var req struct {
		VoiceID string `json:"voice_id"`
	}
	_ = c.Bind(&req)
	l, made, err := h.svc.AdminGenerateAudio(c.Request().Context(), c.Param("id"), req.VoiceID)
	if err != nil && l.ID != "" {
		// بخشی ساخته شده؛ درس به‌روز را هم با پیام خطا برمی‌گردانیم تا پنل همان را نشان دهد.
		return c.JSON(http.StatusBadGateway, echo.Map{"message": err.Error(), "lesson": l, "made": made})
	}
	return respond(c, echo.Map{"lesson": l, "made": made}, err)
}
