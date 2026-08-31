package learninghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/labstack/echo/v4"
)

func (h Handler) CreateScene(c echo.Context) error {

	const op = "learninghandler.Create"

	var req dto.CreateSceneRequest

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	// 2️⃣ اعتبارسنجی فیلدهای اجباری
	if req.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "title_required",
			"message": "عنوان سناریو الزامی است",
		})
	}

	if req.BackgroundImageURL == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "background_image_required",
			"message": "آدرس تصویر پس‌زمینه الزامی است",
		})
	}

	if len(req.Hotspots) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "hotspots_required",
			"message": "حداقل یک هات‌اسپات باید وجود داشته باشد",
		})
	}

	// 3️⃣ اعتبارسنجی Difficulty
	validDifficulties := map[string]bool{
		"beginner":     true,
		"intermediate": true,
		"advanced":     true,
	}
	if !validDifficulties[req.Difficulty] {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_difficulty",
			"message": "سطح زبان‌آموز باید یکی از مقادیر beginner, intermediate, advanced باشد",
		})
	}

	// 4️⃣ اعتبارسنجی Hotspot‌ها و Dialogues
	for i, hReq := range req.Hotspots {
		if hReq.Name == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error":   "hotspot_name_required",
				"message": "نام هات‌اسپات شماره " + string(rune(i+1)) + " الزامی است",
			})
		}

		if hReq.XPosition < 0 || hReq.XPosition > 100 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error":   "invalid_x_position",
				"message": "موقعیت X هات‌اسپات باید بین 0 تا 100 باشد",
			})
		}

		if hReq.YPosition < 0 || hReq.YPosition > 100 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error":   "invalid_y_position",
				"message": "موقعیت Y هات‌اسپات باید بین 0 تا 100 باشد",
			})
		}

		// اعتبارسنجی دیالوگ‌های هر هات‌اسپات
		for j, dReq := range hReq.Dialogues {
			if dReq.OriginalText == "" {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error":   "dialogue_text_required",
					"message": "متن دیالوگ شماره " + string(rune(j+1)) + " در هات‌اسپات " + hReq.Name + " الزامی است",
				})
			}

			validSpeakers := map[string]bool{
				"customer": true,
				"clerk":    true,
				"npc":      true,
			}
			if !validSpeakers[dReq.Speaker] {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error":   "invalid_speaker",
					"message": "نوع گوینده باید یکی از مقادیر customer, clerk, npc باشد",
				})
			}

			validDisplayTypes := map[string]bool{
				"full":    true,
				"partial": true,
				"none":    true,
			}
			if !validDisplayTypes[dReq.DisplayType] {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error":   "invalid_display_type",
					"message": "نوع نمایش باید یکی از مقادیر full, partial, none باشد",
				})
			}
		}
	}

	// 5️⃣ فراخوانی سرویس
	scene, err := h.learningSvc.CreateScene(c.Request().Context(), req)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	// 6️⃣ پاسخ موفق
	return c.JSON(http.StatusCreated, scene)

}
