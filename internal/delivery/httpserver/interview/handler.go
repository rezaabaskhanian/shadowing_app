package interviewhandler

import (
	"net/http"
	"strconv"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/pkg/upload"
	authservice "shadowing-backend/internal/service/auth"
	interviewservice "shadowing-backend/internal/service/interview"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc        *interviewservice.Service
	authSvc    authservice.Service
	authConfig authservice.Config
	uploadDir  string
}

func New(svc *interviewservice.Service, authSvc authservice.Service, authConfig authservice.Config, uploadDir string) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig, uploadDir: uploadDir}
}

func (h Handler) SetInterviewRoutes(e *echo.Echo) {
	auth := middlware.Auth(h.authSvc, h.authConfig)

	app := e.Group("/v1/interviews", auth)
	app.GET("", h.List)
	app.GET("/:id", h.Get)
	app.POST("/:id/attempts", h.Start)
	app.POST("/attempts/:attemptID/questions/:questionID/answer", h.Answer)
	app.POST("/attempts/:attemptID/finish", h.Finish)

	admin := e.Group("/v1/admin/interviews", auth, middlware.AdminOnly)
	admin.GET("", h.AdminList)
	admin.GET("/:id", h.AdminGet)
	admin.POST("", h.AdminCreate)
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
	list, err := h.svc.ListSets(c.Request().Context(), uid)
	return respond(c, list, err)
}

func (h Handler) Get(c echo.Context) error {
	set, err := h.svc.GetSet(c.Request().Context(), c.Param("id"))
	return respond(c, set, err)
}

func (h Handler) Start(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	id, err := h.svc.Start(c.Request().Context(), uid, c.Param("id"))
	return respond(c, echo.Map{"attempt_id": id}, err)
}

// Answer فرم multipart: audio (فایل ضبط) + duration (ثانیه‌های ضبط‌شده).
func (h Handler) Answer(c echo.Context) error {
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
	res, err := h.svc.Answer(c.Request().Context(), uid, c.Param("attemptID"), c.Param("questionID"), localPath, duration)
	return respond(c, res, err)
}

func (h Handler) Finish(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	rep, err := h.svc.Finish(c.Request().Context(), uid, c.Param("attemptID"))
	return respond(c, rep, err)
}

// ---------- ادمین ----------

func (h Handler) AdminList(c echo.Context) error {
	list, err := h.svc.AdminList(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) AdminGet(c echo.Context) error {
	set, err := h.svc.AdminGet(c.Request().Context(), c.Param("id"))
	return respond(c, set, err)
}

func (h Handler) save(c echo.Context, id string) error {
	var req interviewservice.Set
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	set, err := h.svc.AdminSave(c.Request().Context(), id, req)
	return respond(c, set, err)
}

func (h Handler) AdminCreate(c echo.Context) error { return h.save(c, "") }
func (h Handler) AdminUpdate(c echo.Context) error { return h.save(c, c.Param("id")) }

func (h Handler) AdminDelete(c echo.Context) error {
	return respond(c, echo.Map{"ok": true}, h.svc.AdminDelete(c.Request().Context(), c.Param("id")))
}
