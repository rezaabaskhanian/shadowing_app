package learninghandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/labstack/echo/v4"
)

// هر پاسخ درست ۵ امتیاز تجربه به همان صحنه اضافه می‌کند — هم‌ردیف با پاداش
// تکمیل دیالوگ‌ها، نه یک واحد جدا و بی‌ربط.
const xpPerCorrectQuizAnswer = 5

// GetSceneQuiz چند سوال چهارگزینه‌ی درک شنیداری برای این صحنه می‌سازد.
func (h Handler) GetSceneQuiz(c echo.Context) error {
	sceneID := c.Param("sceneID")

	questions, err := h.learningSvc.GenerateSceneQuiz(c.Request().Context(), sceneID)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, questions)
}

// SubmitSceneQuiz پاسخ‌های کاربر را سمت سرور نمره‌دهی می‌کند و برای هر
// پاسخ درست XP کوچکی به پیشرفت همان صحنه اضافه می‌کند.
func (h Handler) SubmitSceneQuiz(c echo.Context) error {
	sceneID := c.Param("sceneID")

	var req dto.QuizSubmitRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	correct, total := h.learningSvc.CheckSceneQuizAnswers(c.Request().Context(), req.Answers)

	xpAwarded := correct * xpPerCorrectQuizAnswer
	if h.progressSvc != nil {
		if userClaims, err := claims.GetClaims(c); err == nil {
			// خطای اهدای XP نباید نتیجه‌ی نمره‌ی کوئیزی که کاربر همین حالا
			// گرفت را از او دریغ کند — best-effort، فقط لاگ داخلی سرویس.
			_ = h.progressSvc.AwardBonusXP(c.Request().Context(), userClaims.UserID, sceneID, xpAwarded)
		}
	}

	return c.JSON(http.StatusOK, dto.QuizResult{
		Correct:   correct,
		Total:     total,
		XPAwarded: xpAwarded,
	})
}
