package topicspeakinghandler

import (
	"net/http"
	"strconv"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/pkg/upload"
	authservice "shadowing-backend/internal/service/auth"
	topicspeakingservice "shadowing-backend/internal/service/topicspeaking"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc        *topicspeakingservice.Service
	authSvc    authservice.Service
	authConfig authservice.Config
	uploadDir  string
}

func New(svc *topicspeakingservice.Service, authSvc authservice.Service, authConfig authservice.Config, uploadDir string) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig, uploadDir: uploadDir}
}

func (h Handler) SetTopicSpeakingRoutes(e *echo.Echo) {
	auth := middlware.Auth(h.authSvc, h.authConfig)

	app := e.Group("/v1/topic-speaking", auth)
	app.GET("/topics", h.List)
	app.POST("/topics/:id/attempt", h.Attempt)

	admin := e.Group("/v1/admin/speaking-topics", auth, middlware.AdminOnly)
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

// ---------- اپ ----------

func (h Handler) List(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	list, err := h.svc.ListTopics(c.Request().Context(), uid)
	return respond(c, list, err)
}

// Attempt فرم multipart: audio (فایل ضبط) + duration (ثانیه‌های ضبط‌شده).
func (h Handler) Attempt(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	fileHeader, ferr := c.FormFile("audio")
	if ferr != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "فایل صوتی ارسال نشده است"})
	}
	duration, _ := strconv.Atoi(c.FormValue("duration"))
	localPath, uerr := upload.SaveRecording(fileHeader, h.uploadDir)
	if uerr != nil {
		return errorhandling.ErrorHandling(uerr, c)
	}
	res, err := h.svc.Attempt(c.Request().Context(), uid, c.Param("id"), localPath, duration)
	return respond(c, res, err)
}

// ---------- ادمین ----------

func (h Handler) AdminList(c echo.Context) error {
	list, err := h.svc.AdminList(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) save(c echo.Context, id string) error {
	var req topicspeakingservice.Topic
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	t, err := h.svc.AdminSave(c.Request().Context(), id, req)
	return respond(c, t, err)
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
