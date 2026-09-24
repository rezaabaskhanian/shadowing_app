package verbhandler

import (
	"net/http"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/pkg/upload"
	postgresverb "shadowing-backend/internal/repository/postgres/verb"
	authservice "shadowing-backend/internal/service/auth"
	verbservice "shadowing-backend/internal/service/verb"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc        *verbservice.Service
	authSvc    authservice.Service
	authConfig authservice.Config
	uploadDir  string
}

func New(svc *verbservice.Service, authSvc authservice.Service, authConfig authservice.Config, uploadDir string) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig, uploadDir: uploadDir}
}

func (h Handler) SetVerbRoutes(e *echo.Echo) {
	app := e.Group("/v1/verbs", middlware.Auth(h.authSvc, h.authConfig))
	app.GET("", h.List)
	app.GET("/pending", h.Pending)
	app.GET("/scene/:sceneID", h.SceneTags)
	app.GET("/:id", h.Get)
	app.GET("/:id/quiz", h.Quiz)
	app.POST("/meanings/:mid/seen", h.Seen)
	app.POST("/meanings/:mid/answer", h.Answer)
	app.POST("/meanings/:mid/speak", h.Speak)

	admin := e.Group("/v1/admin/verbs", middlware.Auth(h.authSvc, h.authConfig), middlware.AdminOnly)
	admin.GET("", h.AdminList)
	admin.POST("", h.AdminCreate)
	admin.GET("/:id", h.AdminGet)
	admin.PUT("/:id", h.AdminUpdate)
	admin.DELETE("/:id", h.AdminDelete)
	admin.POST("/:id/suggest-meanings", h.AdminSuggestMeanings)
	admin.POST("/:id/scan", h.AdminScan)
	admin.POST("/:id/meanings", h.AdminCreateMeaning)
	admin.PUT("/meanings/:mid", h.AdminUpdateMeaning)
	admin.DELETE("/meanings/:mid", h.AdminDeleteMeaning)
	admin.PUT("/occurrences/:oid", h.AdminReviewOccurrence)
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
	list, err := h.svc.ListVerbs(c.Request().Context(), uid)
	return respond(c, list, err)
}

func (h Handler) Get(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	v, err := h.svc.GetVerb(c.Request().Context(), uid, c.Param("id"))
	return respond(c, v, err)
}

func (h Handler) SceneTags(c echo.Context) error {
	tags, err := h.svc.SceneTags(c.Request().Context(), c.Param("sceneID"))
	return respond(c, tags, err)
}

func (h Handler) Pending(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	p, err := h.svc.PendingPractice(c.Request().Context(), uid)
	return respond(c, echo.Map{"pending": p}, err)
}

func (h Handler) Quiz(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	q, err := h.svc.Quiz(c.Request().Context(), uid, c.Param("id"))
	return respond(c, q, err)
}

func (h Handler) Seen(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	return respond(c, echo.Map{"ok": true}, h.svc.MarkSeen(c.Request().Context(), uid, c.Param("mid")))
}

func (h Handler) Answer(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	var req struct {
		ChosenMeaningID string `json:"chosen_meaning_id"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	res, err := h.svc.Answer(c.Request().Context(), uid, c.Param("mid"), req.ChosenMeaningID)
	return respond(c, res, err)
}

func (h Handler) Speak(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	fileHeader, ferr := c.FormFile("audio")
	if ferr != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "فایل صوتی ارسال نشده است"})
	}
	localPath, uerr := upload.SaveRecording(fileHeader, h.uploadDir)
	if uerr != nil {
		return errorhandling.ErrorHandling(uerr, c)
	}
	res, err := h.svc.Speak(c.Request().Context(), uid, c.Param("mid"), localPath)
	return respond(c, res, err)
}

// ---------- ادمین ----------

func (h Handler) AdminList(c echo.Context) error {
	list, err := h.svc.AdminListVerbs(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) AdminGet(c echo.Context) error {
	d, err := h.svc.AdminGetVerb(c.Request().Context(), c.Param("id"))
	return respond(c, d, err)
}

func (h Handler) saveVerb(c echo.Context, id string) error {
	var req postgresverb.Verb
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	v, err := h.svc.AdminSaveVerb(c.Request().Context(), id, req)
	return respond(c, v, err)
}

func (h Handler) AdminCreate(c echo.Context) error { return h.saveVerb(c, "") }
func (h Handler) AdminUpdate(c echo.Context) error { return h.saveVerb(c, c.Param("id")) }

func (h Handler) AdminDelete(c echo.Context) error {
	return respond(c, echo.Map{"ok": true}, h.svc.AdminDeleteVerb(c.Request().Context(), c.Param("id")))
}

func (h Handler) AdminSuggestMeanings(c echo.Context) error {
	s, err := h.svc.AdminSuggestMeanings(c.Request().Context(), c.Param("id"))
	return respond(c, s, err)
}

func (h Handler) AdminScan(c echo.Context) error {
	r, err := h.svc.AdminScan(c.Request().Context(), c.Param("id"))
	return respond(c, r, err)
}

func (h Handler) saveMeaning(c echo.Context, verbID, meaningID string) error {
	var req postgresverb.Meaning
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	m, err := h.svc.AdminSaveMeaning(c.Request().Context(), verbID, meaningID, req)
	return respond(c, m, err)
}

func (h Handler) AdminCreateMeaning(c echo.Context) error { return h.saveMeaning(c, c.Param("id"), "") }
func (h Handler) AdminUpdateMeaning(c echo.Context) error {
	return h.saveMeaning(c, "", c.Param("mid"))
}

func (h Handler) AdminDeleteMeaning(c echo.Context) error {
	return respond(c, echo.Map{"ok": true}, h.svc.AdminDeleteMeaning(c.Request().Context(), c.Param("mid")))
}

func (h Handler) AdminReviewOccurrence(c echo.Context) error {
	var req struct {
		Status    string `json:"status"`
		MeaningID string `json:"meaning_id"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	err := h.svc.AdminReviewOccurrence(c.Request().Context(), c.Param("oid"), req.Status, req.MeaningID)
	return respond(c, echo.Map{"ok": true}, err)
}
