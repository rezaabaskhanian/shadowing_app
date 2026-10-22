package adminhandler

import (
	"encoding/json"
	"net/http"

	"shadowing-backend/internal/pkg/errorhandling"
	learningservice "shadowing-backend/internal/service/learning"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/labstack/echo/v4"
)

// CreateScene یک صحنه‌ی جدید همراه با هات‌اسپات‌های تعیین‌شده توسط ادمین می‌سازد.
func (h Handler) CreateScene(c echo.Context) error {
	var req dto.CreateSceneRequest

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	scene, err := h.learningSvc.CreateScene(c.Request().Context(), req)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	h.scanSceneVerbs(scene.ID)

	return c.JSON(http.StatusCreated, scene)
}

// ListScenes همه‌ی صحنه‌ها را برای نمایش در پنل برمی‌گرداند.
func (h Handler) ListScenes(c echo.Context) error {
	scenes, err := h.learningSvc.ListScene(c.Request().Context())
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, scenes)
}

// GetScene یک صحنه را همراه با هات‌اسپات‌هایش برمی‌گرداند.
func (h Handler) GetScene(c echo.Context) error {
	sceneID := c.Param("sceneID")

	scene, err := h.learningSvc.GetScene(c.Request().Context(), sceneID)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, scene)
}

// UpdateScene یک صحنه‌ی موجود را همراه با هات‌اسپات‌ها و دیالوگ‌هایش به‌روزرسانی می‌کند.
func (h Handler) UpdateScene(c echo.Context) error {
	sceneID := c.Param("sceneID")

	var req dto.CreateSceneRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	scene, err := h.learningSvc.UpdateScene(c.Request().Context(), sceneID, req)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	h.scanSceneVerbs(scene.ID)

	return c.JSON(http.StatusOK, scene)
}

// UpdateSceneOrder فقط ترتیب یک صحنه در مسیر آموزشی را عوض می‌کند — برای
// مرتب‌سازی سریع از لیست صحنه‌ها بدون باز کردن فرم کامل ویرایش.
func (h Handler) UpdateSceneOrder(c echo.Context) error {
	sceneID := c.Param("sceneID")

	var req struct {
		Order int `json:"order"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	if err := h.learningSvc.UpdateSceneOrder(c.Request().Context(), sceneID, req.Order); err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "ترتیب صحنه به‌روزرسانی شد"})
}

// UpdateSceneDifficulty فقط سطح یک صحنه را عوض می‌کند — برای جابه‌جایی صحنه
// بین سطح‌ها بدون از بین رفتن پیشرفت کاربرها.
func (h Handler) UpdateSceneDifficulty(c echo.Context) error {
	sceneID := c.Param("sceneID")

	var req struct {
		Difficulty string `json:"difficulty"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	if err := h.learningSvc.UpdateSceneDifficulty(c.Request().Context(), sceneID, req.Difficulty); err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "سطح صحنه به‌روزرسانی شد"})
}

// FixSceneText ترجمه‌ی دیالوگ‌ها و/یا نکته‌ی گرامری را درجا اصلاح می‌کند
// (برای صحنه‌های منتشرشده امن است؛ پیشرفت کاربرها پاک نمی‌شود).
func (h Handler) FixSceneText(c echo.Context) error {
	var req struct {
		Translations       []learningservice.TranslationFix `json:"translations"`
		GrammarTopic       *string                          `json:"grammar_topic"`
		GrammarExplanation *string                          `json:"grammar_explanation"`
		GrammarExamples    json.RawMessage                  `json:"grammar_examples"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}
	n, err := h.learningSvc.FixSceneText(c.Request().Context(), c.Param("sceneID"), req.Translations, req.GrammarTopic, req.GrammarExplanation, req.GrammarExamples)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, map[string]any{"fixed_translations": n})
}

// DeleteScene یک صحنه را حذف می‌کند.
func (h Handler) DeleteScene(c echo.Context) error {
	sceneID := c.Param("sceneID")

	if err := h.learningSvc.DeleteScene(c.Request().Context(), sceneID); err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "صحنه با موفقیت حذف شد",
	})
}
