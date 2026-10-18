package learninghandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"

	"github.com/labstack/echo/v4"
)

type createFeedbackRequest struct {
	Message string `json:"message"`
}

// CreateFeedback پیام «پیشنهاد یا انتقاد» کاربر را از درج اپ موبایل ثبت می‌کند.
func (h Handler) CreateFeedback(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	var req createFeedbackRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if req.Message == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "متن پیام الزامی است"})
	}

	f, err := h.feedbackSvc.Create(c.Request().Context(), userClaims.UserID, req.Message)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در ثبت پیام"})
	}

	return c.JSON(http.StatusCreated, f)
}

// MyFeedbackReplies جواب‌های ادمین به کاربر (از ربات یا پنل) برای صفحه‌ی
// «پیشنهاد و انتقاد» اپ؛ اگر نوتیف نرسیده باشد، جواب اینجا دیده می‌شود.
func (h Handler) MyFeedbackReplies(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}
	list, err := h.feedbackSvc.MyReplies(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن پیام‌ها"})
	}
	return c.JSON(http.StatusOK, echo.Map{"replies": list})
}
