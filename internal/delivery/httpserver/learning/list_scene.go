package learninghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/learning/dto"

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

// isAdminCaller می‌گوید آیا درخواست‌دهنده نقش ادمین دارد (ادمین‌ها هیچ‌وقت
// در مسیر ترتیبی قفل نمی‌شوند، برای مدیریت محتوا لازم است همه‌چیز باز باشد).
func isAdminCaller(c echo.Context) bool {
	userClaims, err := claims.GetClaims(c)
	return err == nil && userClaims.Role == "admin"
}

// freeSampleSceneIDs شناسه‌ی اولین صحنه‌ی منتشرشده‌ی هر سطح دشواری را
// برمی‌گرداند — این صحنه‌ها همیشه رایگان‌اند (چه ادمین دستی قفلشان کرده
// باشد چه کاربر اشتراک نداشته باشد)، تا هر کاربری بتواند از هر سه سطح یک
// نمونه‌ی رایگان امتحان کند، مستقل از تنظیم دستی ادمین روی آن صحنه‌ی خاص.
func freeSampleSceneIDs(scenes []dto.Scene) map[string]bool {
	seenDifficulty := map[string]bool{}
	free := map[string]bool{}
	for _, s := range scenes {
		if s.Status != "published" {
			continue
		}
		if !seenDifficulty[s.Difficulty] {
			seenDifficulty[s.Difficulty] = true
			free[s.ID] = true
		}
	}
	return free
}

// applySequenceLock صحنه‌های منتشرشده‌ی این اسلایس را به ترتیب (که GetAll
// از قبل بر اساس "order" مرتب برگردانده) می‌پیماید و SequenceLocked هر صحنه
// را پر می‌کند: تا وقتی صحنه‌ی منتشرشده‌ی قبلیِ *همان سطح دشواری* کامل نشده،
// صحنه‌های بعدیِ همان سطح قفل‌اند. زنجیره‌ی هر سطح (beginner/intermediate/
// advanced) جدا از بقیه است — وگرنه یک کاربر پیشرفته مجبور می‌شد کل صحنه‌های
// مبتدی را یکی‌یکی تمام کند تا به صحنه‌ی سطح خودش برسد؛ با این تفکیک، اولین
// صحنه‌ی هر سطح از همان اول باز است. IsCompleted باید از قبل روی هر آیتم پر
// شده باشد. پیش‌نویس/آرشیوشده در هیچ زنجیره‌ای شرکت نمی‌کنند.
func applySequenceLock(scenes []dto.Scene, isAdmin bool) {
	blockedByDifficulty := map[string]bool{}
	for i := range scenes {
		if scenes[i].Status != "published" {
			scenes[i].SequenceLocked = false
			continue
		}
		diff := scenes[i].Difficulty
		scenes[i].SequenceLocked = blockedByDifficulty[diff] && !isAdmin
		if !scenes[i].IsCompleted {
			blockedByDifficulty[diff] = true
		}
	}
}

func (h Handler) ListScene(c echo.Context) error {
	const op = "learninghandler.ListScene"

	scenes, err := h.learningSvc.ListScene(c.Request().Context())

	if err != nil {

		return errorhandling.ErrorHandling(err, c)
	}

	freeSamples := freeSampleSceneIDs(scenes)
	for i := range scenes {
		if freeSamples[scenes[i].ID] {
			scenes[i].IsLocked = false
		} else {
			scenes[i].IsLocked = h.isSceneLocked(c, scenes[i].IsLocked)
		}
		scenes[i].Progress, scenes[i].IsCompleted = h.sceneProgressForUser(c, scenes[i].ID)
	}
	applySequenceLock(scenes, isAdminCaller(c))

	return c.JSON(http.StatusOK, scenes)

}
