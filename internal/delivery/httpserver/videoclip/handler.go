package videocliphandler

import (
	"net/http"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	authservice "shadowing-backend/internal/service/auth"
	videoclipservice "shadowing-backend/internal/service/videoclip"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc        *videoclipservice.Service
	authSvc    authservice.Service
	authConfig authservice.Config
}

func New(svc *videoclipservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig}
}

func (h Handler) SetVideoClipRoutes(e *echo.Echo) {
	auth := middlware.Auth(h.authSvc, h.authConfig)

	app := e.Group("/v1/video-clips", auth)
	app.GET("", h.List)
	app.GET("/:id", h.Get)
	app.POST("/:id/attempts", h.RecordAttempt)

	admin := e.Group("/v1/admin/video-clips", auth, middlware.AdminOnly)
	admin.GET("", h.AdminList)
	admin.POST("", h.AdminCreate)
	admin.POST("/upload-video", h.AdminUploadVideo)
	admin.POST("/detect-lines", h.AdminDetectLines)
	admin.POST("/complete", h.AdminComplete)
	admin.GET("/:id", h.AdminGet)
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
	list, err := h.svc.ListClips(c.Request().Context(), uid)
	return respond(c, list, err)
}

func (h Handler) Get(c echo.Context) error {
	clip, err := h.svc.GetClip(c.Request().Context(), c.Param("id"))
	return respond(c, clip, err)
}

func (h Handler) RecordAttempt(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	var req struct {
		Speaker string `json:"speaker"`
		Score   int    `json:"score"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	err = h.svc.RecordAttempt(c.Request().Context(), uid, c.Param("id"), req.Speaker, req.Score)
	return respond(c, echo.Map{"ok": true}, err)
}

// ---------- ادمین ----------

func (h Handler) AdminList(c echo.Context) error {
	list, err := h.svc.AdminList(c.Request().Context())
	return respond(c, list, err)
}

func (h Handler) AdminGet(c echo.Context) error {
	clip, err := h.svc.AdminGet(c.Request().Context(), c.Param("id"))
	return respond(c, clip, err)
}

func (h Handler) save(c echo.Context, id string) error {
	var req videoclipservice.Clip
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	clip, err := h.svc.AdminSave(c.Request().Context(), id, req)
	return respond(c, clip, err)
}

func (h Handler) AdminCreate(c echo.Context) error { return h.save(c, "") }
func (h Handler) AdminUpdate(c echo.Context) error { return h.save(c, c.Param("id")) }

func (h Handler) AdminDelete(c echo.Context) error {
	return respond(c, echo.Map{"ok": true}, h.svc.AdminDelete(c.Request().Context(), c.Param("id")))
}

// AdminUploadVideo فیلد فرم: "video" (multipart/form-data).
func (h Handler) AdminUploadVideo(c echo.Context) error {
	fileHeader, err := c.FormFile("video")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "فایل ویدیو ارسال نشده است (فیلد video)"})
	}
	src, err := fileHeader.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "خطا در خواندن فایل"})
	}
	defer src.Close()
	url, err := h.svc.SaveVideo(c.Request().Context(), fileHeader.Filename, fileHeader.Size, src)
	return respond(c, echo.Map{"url": url}, err)
}

func (h Handler) AdminDetectLines(c echo.Context) error {
	var req struct {
		VideoURL string `json:"video_url"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	lines, err := h.svc.AdminDetectLines(c.Request().Context(), req.VideoURL)
	return respond(c, lines, err)
}

func (h Handler) AdminComplete(c echo.Context) error {
	var req struct {
		Title         string                  `json:"title"`
		DescriptionFa string                  `json:"description_fa"`
		Level         string                  `json:"level"`
		Lines         []videoclipservice.Line `json:"lines"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	res, err := h.svc.AdminComplete(c.Request().Context(), req.Title, req.DescriptionFa, req.Level, req.Lines)
	return respond(c, res, err)
}
