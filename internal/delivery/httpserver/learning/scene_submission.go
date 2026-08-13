package learninghandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/upload"
	submissionservice "shadowing-backend/internal/service/submission"

	"github.com/labstack/echo/v4"
)

// UploadImage تصویر پیشنهادی صحنه توسط کاربر عادی را آپلود می‌کند (مشابه آپلود
// ادمین، اما پشت احراز هویت ساده، نه AdminOnly).
func (h Handler) UploadImage(c echo.Context) error {
	fileHeader, err := c.FormFile("image")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "فایل تصویر ارسال نشده است (فیلد image)"})
	}

	url, filename, err := upload.SaveImage(fileHeader, h.uploadDir, h.publicPath)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": err.Error()})
	}

	return c.JSON(http.StatusCreated, echo.Map{"url": url, "filename": filename})
}

type dialogueLineInput struct {
	Speaker string `json:"speaker"`
	Text    string `json:"text"`
}

type createSubmissionRequest struct {
	ImageURL      string              `json:"image_url"`
	SituationText string              `json:"situation_text"`
	Dialogues     []dialogueLineInput `json:"dialogues"`
}

// CreateSceneSubmission پیشنهاد یک موقعیت/صحنه‌ی جدید (عکس یا متن + دیالوگ‌های
// خودِ کاربر) را برای بررسی توسط ادمین ثبت می‌کند.
func (h Handler) CreateSceneSubmission(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	var req createSubmissionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if req.SituationText == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "توضیح موقعیت الزامی است"})
	}
	if len(req.Dialogues) == 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "حداقل یک خط دیالوگ لازم است"})
	}

	dialogues := make([]submissionservice.DialogueLine, 0, len(req.Dialogues))
	for _, d := range req.Dialogues {
		if d.Text == "" {
			continue
		}
		dialogues = append(dialogues, submissionservice.DialogueLine{Speaker: d.Speaker, Text: d.Text})
	}

	sub, err := h.submissionSvc.Create(c.Request().Context(), userClaims.UserID, req.ImageURL, req.SituationText, dialogues)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در ثبت پیشنهاد صحنه"})
	}

	return c.JSON(http.StatusCreated, sub)
}

// MySceneSubmissions پیشنهادهای ثبت‌شده توسط کاربر جاری را برمی‌گرداند.
func (h Handler) MySceneSubmissions(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	list, err := h.submissionSvc.ListMine(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن پیشنهادها"})
	}

	return c.JSON(http.StatusOK, echo.Map{"submissions": list})
}

// MyPoints موجودی امتیاز کاربر جاری را برمی‌گرداند.
func (h Handler) MyPoints(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	points, err := h.submissionSvc.UserPoints(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن امتیاز"})
	}

	return c.JSON(http.StatusOK, echo.Map{"points": points})
}

// SubscriptionPlans طرح‌های اشتراک موجود را برمی‌گرداند (برای نمایش در اپ).
func (h Handler) SubscriptionPlans(c echo.Context) error {
	plans, err := h.subscriptionSvc.ListPlans(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن طرح‌های اشتراک"})
	}
	return c.JSON(http.StatusOK, echo.Map{"plans": plans})
}
