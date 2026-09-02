package learninghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

// isSceneLocked می‌گوید آیا یک صحنه برای این کاربر قفل است: قفل‌بودن یک صحنه
// را ادمین از پنل ادمین به‌صورت دستی روی خودِ صحنه تعیین می‌کند (manualLocked).
// ادمین‌ها هرگز قفل نمی‌بینند (برای مدیریت محتوا لازم است همه‌چیز را ببینند)؛
// برای بقیه، صحنه‌های دستی-قفل‌شده فقط با اشتراک فعال باز می‌شوند.
func (h Handler) isSceneLocked(c echo.Context, manualLocked bool) bool {
	if !manualLocked {
		return false
	}
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return true
	}
	if userClaims.Role == "admin" {
		return false
	}
	hasSub, err := h.subscriptionSvc.HasActiveSubscription(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return true
	}
	return !hasSub
}

// sceneProgressForUser پیشرفت کاربرِ درخواست‌دهنده در یک صحنه را برمی‌گرداند؛
// اگر کاربر لاگین نبود یا هنوز چیزی تمرین نکرده بود، صفر/false برمی‌گردد.
func (h Handler) sceneProgressForUser(c echo.Context, sceneID string) (progress int, isCompleted bool) {
	if h.progressSvc == nil {
		return 0, false
	}
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return 0, false
	}
	progress, isCompleted, err = h.progressSvc.GetSceneProgress(c.Request().Context(), userClaims.UserID, sceneID)
	if err != nil {
		return 0, false
	}
	return progress, isCompleted
}

// dialogueProgressForUser نمره‌ی هر دیالوگِ این صحنه را که کاربر درخواست‌دهنده
// قبلاً ضبط/تکمیل کرده برمی‌گرداند (کلید = dialogueID)؛ اگر کاربر لاگین
// نبود یا هنوز چیزی ضبط نکرده بود، مپ خالی برمی‌گردد. برای رفع این باگ که
// با بازگشت به صحنه، دیالوگ‌های قبلاً ضبط‌شده گم به‌نظر می‌رسیدند.
func (h Handler) dialogueProgressForUser(c echo.Context, sceneID string) map[string]float64 {
	if h.progressSvc == nil {
		return nil
	}
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return nil
	}
	scores, err := h.progressSvc.GetDialogueProgress(c.Request().Context(), userClaims.UserID, sceneID)
	if err != nil {
		return nil
	}
	return scores
}

func (h Handler) ListScene(c echo.Context) error {
	const op = "learninghandler.ListScene"

	scenes, err := h.learningSvc.ListScene(c.Request().Context())

	if err != nil {

		return errorhandling.ErrorHandling(err, c)
	}

	for i := range scenes {
		scenes[i].IsLocked = h.isSceneLocked(c, scenes[i].IsLocked)
		scenes[i].Progress, scenes[i].IsCompleted = h.sceneProgressForUser(c, scenes[i].ID)
	}

	return c.JSON(http.StatusOK, scenes)

}
