package learninghandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"

	"github.com/labstack/echo/v4"
)

type createTopicSuggestionRequest struct {
	TopicText string `json:"topic_text"`
}

// CreateTopicSuggestion پیشنهاد یک موضوع/سناریوی جدید (فقط متن، بدون دیالوگ)
// را برای بررسی توسط ادمین ثبت می‌کند.
func (h Handler) CreateTopicSuggestion(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	var req createTopicSuggestionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if req.TopicText == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "متن موضوع الزامی است"})
	}

	sug, err := h.topicSuggestionSvc.Create(c.Request().Context(), userClaims.UserID, req.TopicText)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در ثبت پیشنهاد موضوع"})
	}

	return c.JSON(http.StatusCreated, sug)
}

// MyTopicSuggestions پیشنهادهای موضوع ثبت‌شده توسط کاربر جاری را برمی‌گرداند.
func (h Handler) MyTopicSuggestions(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	list, err := h.topicSuggestionSvc.ListMine(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن پیشنهادها"})
	}

	return c.JSON(http.StatusOK, echo.Map{"suggestions": list})
}
