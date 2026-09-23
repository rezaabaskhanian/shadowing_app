package learninghandler

import (
	"errors"
	"log/slog"
	"net/http"

	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/labstack/echo/v4"
)

// GetSceneQuiz چند سوال چهارگزینه‌ی درک شنیداری برای این صحنه می‌سازد.
func (h Handler) GetSceneQuiz(c echo.Context) error {
	sceneID := c.Param("sceneID")

	questions, err := h.learningSvc.GenerateSceneQuiz(c.Request().Context(), sceneID)
	if err != nil {
		// RichError.Error() فقط پیام را برمی‌گرداند و خطای اصلی (مثلاً خطای SQL) در
		// زنجیره‌ی Unwrap است؛ برای لاگ باید تا ریشه پایین رفت.
		root := err
		for errors.Unwrap(root) != nil {
			root = errors.Unwrap(root)
		}
		slog.Warn("quiz: failed to generate scene quiz", "scene_id", sceneID, "cause", root.Error())
		return errorhandling.ErrorHandling(err, c)
	}
	if len(questions) == 0 {
		slog.Warn("quiz: no questions could be built", "scene_id", sceneID)
	}

	return c.JSON(http.StatusOK, questions)
}

// SubmitSceneQuiz پاسخ‌های کاربر را سمت سرور نمره‌دهی می‌کند. کوئیز XP
// نمی‌دهد: XP فقط برای تمرین صحبت (دیالوگ‌ها) است، و کوئیزِ قابل‌تکرار
// راهی برای جمع‌کردن بی‌نهایت XP می‌شد.
func (h Handler) SubmitSceneQuiz(c echo.Context) error {
	var req dto.QuizSubmitRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	correct, total := h.learningSvc.CheckSceneQuizAnswers(c.Request().Context(), req.Answers)

	return c.JSON(http.StatusOK, dto.QuizResult{
		Correct: correct,
		Total:   total,
	})
}
