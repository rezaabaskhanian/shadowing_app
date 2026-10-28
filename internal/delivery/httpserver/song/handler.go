package songhandler

import (
	"encoding/base64"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

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
	app.POST("/:id/mix", h.Mix)

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

// maxTakeUpload سقف حجم ضبط کاربر برای ترکیب (m4a چنددقیقه‌ای چند مگابایت است).
const maxTakeUpload = 15 << 20

// Mix ضبط کاربر را با موزیک بی‌کلام همان تکه یکی می‌کند و mp3 را به‌صورت base64
// برمی‌گرداند تا اپ در گوشی ذخیره‌اش کند. صدای کاربر روی سرور نمی‌ماند.
func (h Handler) Mix(c echo.Context) error {
	bad := func(msg string) error {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": msg})
	}
	fh, err := c.FormFile("audio")
	if err != nil {
		return bad("فایل ضبط ارسال نشده")
	}
	if fh.Size > maxTakeUpload {
		return bad("فایل ضبط خیلی بزرگ است")
	}
	offsetMs, _ := strconv.Atoi(c.FormValue("offset_ms"))
	durationMs, _ := strconv.Atoi(c.FormValue("duration_ms"))

	src, err := fh.Open()
	if err != nil {
		return bad("فایل ضبط خوانده نشد")
	}
	defer src.Close()
	tmp := filepath.Join(os.TempDir(), "song-take-"+strconv.FormatInt(time.Now().UnixNano(), 10)+filepath.Ext(fh.Filename))
	dst, err := os.Create(tmp)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "خطای سرور"})
	}
	_, copyErr := io.Copy(dst, src)
	dst.Close()
	defer os.Remove(tmp)
	if copyErr != nil {
		return bad("فایل ضبط خوانده نشد")
	}

	out, err := h.svc.MixTake(c.Request().Context(), c.Param("id"), tmp, offsetMs, durationMs)
	if err != nil {
		return respond(c, nil, err)
	}
	defer os.Remove(out)
	data, err := os.ReadFile(out)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"message": "خطای سرور"})
	}
	return c.JSON(http.StatusOK, map[string]string{"mime": "audio/mpeg", "data": base64.StdEncoding.EncodeToString(data)})
}
