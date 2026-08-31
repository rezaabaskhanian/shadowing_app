package progresshandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

type recordDialogueProgressRequest struct {
	SceneID    string  `json:"scene_id"`
	DialogueID string  `json:"dialogue_id"`
	Score      float64 `json:"score"`
}

// RecordDialogueProgress یک جمله‌ی کامل‌شده (ضبط + نمره‌ی مقایسه) را ثبت
// می‌کند و پیشرفت صحنه را دوباره حساب می‌کند.
//
// اپ در مرحله‌ی مقایسه از /v1/shadowing/evaluate استفاده می‌کند که بدون
// session است و پیشرفت صحنه را ثبت نمی‌کند؛ بدون این روت، صحنه هیچ‌وقت در
// لیست خانه تیک نمی‌خورد. خودِ سرویس idempotent است (لجر یکتای
// scene_dialogue_progress)، پس تکرار همان جمله دوباره شمرده نمی‌شود.
func (h *Handler) RecordDialogueProgress(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	var req recordDialogueProgressRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر است"})
	}
	if req.SceneID == "" || req.DialogueID == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "شناسه صحنه و جمله الزامی است"})
	}

	// شناسه‌ی کاربر عمداً از توکن خوانده می‌شود نه از بدنه‌ی درخواست، تا کسی
	// نتواند پیشرفت را به اسم کاربر دیگری ثبت کند.
	resp, err := h.progressSvc.RecordDialogueProgress(
		c.Request().Context(), userClaims.UserID, req.SceneID, req.DialogueID, req.Score,
	)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, resp)
}
