package shadowinghandler

import (
	"net/http"
	"strconv"
	"strings"

	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/pkg/upload"
	"shadowing-backend/internal/service/shadowing/dto"

	"github.com/labstack/echo/v4"
)

// SubmitRecording - ارسال ضبط برای مرحله فعلی
//
// دو حالت ورودی پشتیبانی می‌شود:
//
//   - multipart/form-data با فیلد فایل `audio` → نمره‌دهی واقعی تلفظ انجام
//     می‌شود (کلمه‌به‌کلمه). این حالت را اپ استفاده می‌کند.
//   - application/json بدون فایل → فقط نمره‌ی تخمینی از روی مدت ضبط.
//
// @Summary ارسال ضبط صدا برای مرحله تمرین
// @Description ضبط کاربر را ذخیره و تلفظش را نمره‌دهی می‌کند
// @Tags Shadowing
// @Accept json,mpfd
// @Produce json
// @Param id path string true "شناسه جلسه"
// @Success 200 {object} dto.SubmitRecordingResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/shadowing/session/{id}/recording [post]
func (h *Handler) SubmitRecording(c echo.Context) error {
	sessionID := c.Param("id")
	if sessionID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "session_id_required",
			"message": "شناسه جلسه الزامی است",
		})
	}

	var req dto.SubmitRecordingRequest

	if strings.HasPrefix(c.Request().Header.Get(echo.HeaderContentType), echo.MIMEMultipartForm) {
		parsed, errResp := h.parseMultipartRecording(c)
		if errResp != nil {
			return errResp
		}
		req = *parsed
	} else {
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error":   "invalid_request",
				"message": "درخواست نامعتبر است",
			})
		}
		if req.AudioPath == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error":   "audio_path_required",
				"message": "مسیر فایل صوتی الزامی است",
			})
		}
	}

	if req.Duration <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_duration",
			"message": "مدت زمان ضبط باید بیشتر از صفر باشد",
		})
	}

	req.SessionID = sessionID

	response, err := h.ShadowingSvc.SubmitRecording(c.Request().Context(), req)
	if err != nil {
		// بدون return، پاسخ خطا نوشته می‌شود و بعد پاسخ موفقیت هم روی آن
		// می‌رود؛ در حالت nil بودن response این باعث پنیک می‌شد.
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, response)
}

// parseMultipartRecording فایل صوتی و فیلدهای همراهش را از فرم می‌خواند و
// فایل را روی دیسک ذخیره می‌کند. سرویس بعد از نمره‌دهی خودش پاکش می‌کند.
func (h *Handler) parseMultipartRecording(c echo.Context) (*dto.SubmitRecordingRequest, error) {
	fileHeader, err := c.FormFile("audio")
	if err != nil {
		return nil, c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "audio_required",
			"message": "فایل صوتی ارسال نشده است (فیلد audio)",
		})
	}

	localPath, err := upload.SaveRecording(fileHeader, h.uploadDir)
	if err != nil {
		return nil, errorhandling.ErrorHandling(err, c)
	}

	duration, _ := strconv.Atoi(c.FormValue("duration"))
	expected, _ := strconv.Atoi(c.FormValue("expected_duration"))

	return &dto.SubmitRecordingRequest{
		RecordingType: c.FormValue("recording_type"),
		// AudioPath مسیر نسخه‌ی کاربر روی گوشی است (فقط برای رجوع در دیتابیس).
		// اگر اپ نفرستد، همان مسیر موقت سرور ثبت می‌شود چون دامنه اجازه‌ی
		// خالی بودنش را نمی‌دهد.
		AudioPath:        firstNonEmpty(c.FormValue("audio_path"), localPath),
		Duration:         duration,
		ExpectedDuration: expected,
		LocalAudioPath:   localPath,
	}, nil
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}
