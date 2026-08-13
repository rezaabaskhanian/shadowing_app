package adminhandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/labstack/echo/v4"
)

// ListSceneSubmissions پیشنهادهای کاربران را برمی‌گرداند؛ با ?status=pending
// می‌توان فقط موارد در انتظار بررسی را گرفت.
func (h Handler) ListSceneSubmissions(c echo.Context) error {
	status := c.QueryParam("status")
	list, err := h.submissionSvc.ListByStatus(c.Request().Context(), status)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن پیشنهادها"})
	}
	return c.JSON(http.StatusOK, echo.Map{"submissions": list})
}

// GetSceneSubmission جزئیات یک پیشنهاد را برمی‌گرداند.
func (h Handler) GetSceneSubmission(c echo.Context) error {
	sub, err := h.submissionSvc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"message": "پیشنهاد پیدا نشد"})
	}
	return c.JSON(http.StatusOK, sub)
}

// ApproveSceneSubmission پیشنهاد را با یک صحنه‌ی کامل‌شده توسط ادمین (همان فرم
// SceneCreator، از پیشنهاد کاربر پرشده) منتشر و امتیاز کاربر را اهدا می‌کند.
func (h Handler) ApproveSceneSubmission(c echo.Context) error {
	submissionID := c.Param("id")

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

	points, err := h.submissionSvc.Approve(c.Request().Context(), submissionID, scene.ID, reviewerID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "صحنه ساخته شد اما تایید پیشنهاد ناموفق بود"})
	}

	return c.JSON(http.StatusOK, echo.Map{"scene": scene, "points_awarded": points})
}

type rejectSubmissionRequest struct {
	Note string `json:"note"`
}

// RejectSceneSubmission پیشنهاد را رد می‌کند (بدون اهدای امتیاز).
func (h Handler) RejectSceneSubmission(c echo.Context) error {
	var req rejectSubmissionRequest
	_ = c.Bind(&req)

	reviewerID := ""
	if userClaims, err := claims.GetClaims(c); err == nil {
		reviewerID = userClaims.UserID
	}

	if err := h.submissionSvc.Reject(c.Request().Context(), c.Param("id"), reviewerID, req.Note); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در رد پیشنهاد"})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "پیشنهاد رد شد"})
}
