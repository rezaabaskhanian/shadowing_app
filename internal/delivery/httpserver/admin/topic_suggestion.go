package adminhandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/labstack/echo/v4"
)

// ListTopicSuggestions پیشنهادهای موضوع کاربران را برمی‌گرداند؛ با ?status=pending
// می‌توان فقط موارد در انتظار بررسی را گرفت.
func (h Handler) ListTopicSuggestions(c echo.Context) error {
	status := c.QueryParam("status")
	list, err := h.topicSuggestionSvc.ListByStatus(c.Request().Context(), status)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن پیشنهادها"})
	}
	return c.JSON(http.StatusOK, echo.Map{"suggestions": list})
}

// GetTopicSuggestion جزئیات یک پیشنهاد موضوع را برمی‌گرداند.
func (h Handler) GetTopicSuggestion(c echo.Context) error {
	sug, err := h.topicSuggestionSvc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"message": "پیشنهاد پیدا نشد"})
	}
	return c.JSON(http.StatusOK, sug)
}

// ApproveTopicSuggestion پیشنهاد موضوع را با یک صحنه‌ی کامل‌شده توسط ادمین (که
// خودش با کمک دکمه‌ی «تولید با هوش مصنوعی» یا دستی، با الهام از topic_text
// ساخته) منتشر و امتیاز کاربر را اهدا می‌کند. تولید صحنه با AI اینجا خودکار
// فراخوانی نمی‌شود؛ طبق تصمیم مالک محصول، فقط ادمین با فرم SceneCreator
// موجود این کار را انجام می‌دهد.
func (h Handler) ApproveTopicSuggestion(c echo.Context) error {
	suggestionID := c.Param("id")

	var req dto.CreateSceneRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}

	scene, err := h.learningSvc.CreateScene(c.Request().Context(), req)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	reviewerID := ""
	if userClaims, err := claims.GetClaims(c); err == nil {
		reviewerID = userClaims.UserID
	}

	points, err := h.topicSuggestionSvc.Approve(c.Request().Context(), suggestionID, scene.ID, reviewerID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "صحنه ساخته شد اما تایید پیشنهاد ناموفق بود"})
	}

	return c.JSON(http.StatusOK, echo.Map{"scene": scene, "points_awarded": points})
}

// RejectTopicSuggestion پیشنهاد موضوع را رد می‌کند (بدون اهدای امتیاز).
func (h Handler) RejectTopicSuggestion(c echo.Context) error {
	var req rejectSubmissionRequest
	_ = c.Bind(&req)

	reviewerID := ""
	if userClaims, err := claims.GetClaims(c); err == nil {
		reviewerID = userClaims.UserID
	}

	if err := h.topicSuggestionSvc.Reject(c.Request().Context(), c.Param("id"), reviewerID, req.Note); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در رد پیشنهاد"})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "پیشنهاد رد شد"})
}
