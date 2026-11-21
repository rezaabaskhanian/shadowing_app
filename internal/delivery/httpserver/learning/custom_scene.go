package learninghandler

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/customscene"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// GenerateCustomScene صحنه اختصاصی شادوئینگ از متن، موضوع یا فایل صوتی تولید می‌کند
func (h Handler) GenerateCustomScene(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت نامعتبر است"})
	}

	in := customscene.CreateCustomSceneInput{
		UserID:     userClaims.UserID,
		Topic:      c.FormValue("topic"),
		Text:       c.FormValue("text"),
		Difficulty: c.FormValue("difficulty"),
		VoiceID:    c.FormValue("voice_id"),
	}

	// اگر بدنه به صورت JSON فرستاده شده بود (بدون آپلود فایل)
	if in.Topic == "" && in.Text == "" {
		var jsonReq struct {
			Topic      string `json:"topic"`
			Text       string `json:"text"`
			Difficulty string `json:"difficulty"`
			VoiceID    string `json:"voice_id"`
		}
		if err := c.Bind(&jsonReq); err == nil {
			if jsonReq.Topic != "" {
				in.Topic = jsonReq.Topic
			}
			if jsonReq.Text != "" {
				in.Text = jsonReq.Text
			}
			if jsonReq.Difficulty != "" {
				in.Difficulty = jsonReq.Difficulty
			}
			if jsonReq.VoiceID != "" {
				in.VoiceID = jsonReq.VoiceID
			}
		}
	}

	// بررسی فایل آپلودشده (صوت، متن، سند)
	file, fileErr := c.FormFile("file")
	var tempFilePath string
	if fileErr == nil && file != nil {
		src, err := file.Open()
		if err == nil {
			defer src.Close()

			ext := strings.ToLower(filepath.Ext(file.Filename))
			// اگر فایل متنی ساده بود
			if ext == ".txt" || ext == ".md" || ext == ".csv" || ext == ".json" {
				data, readErr := io.ReadAll(src)
				if readErr == nil {
					in.Text = string(data)
				}
			} else {
				// فایل صوتی یا سند برای پردازش
				tempFilePath = filepath.Join(os.TempDir(), fmtFileName(uuid.NewString(), ext))
				dst, createErr := os.Create(tempFilePath)
				if createErr == nil {
					_, _ = io.Copy(dst, src)
					dst.Close()
					in.AudioPath = tempFilePath
					defer os.Remove(tempFilePath)
				}
			}
		}
	}

	createdScene, err := h.customSceneSvc.GenerateCustomScene(c.Request().Context(), in)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	// ساخت DTO سازگار با فرانت‌اند
	hotspotDTOs := make([]dto.Hotspot, len(createdScene.Hotspots))
	for j, ht := range createdScene.Hotspots {
		dialogueDTOs := make([]dto.Dialogue, len(ht.Dialogues))
		for k, dl := range ht.Dialogues {
			dialogueDTOs[k] = dto.Dialogue{
				ID:           string(dl.ID),
				Order:        dl.Order,
				Speaker:      string(dl.Speaker),
				OriginalText: dl.OriginalText,
				Translation:  dl.Translation,
				AudioURL:     dl.AudioURL,
				DisplayType:  string(dl.DisplayType),
				WaitDuration: dl.WaitDuration,
			}
		}
		hotspotDTOs[j] = dto.Hotspot{
			ID:        string(ht.ID),
			Name:      ht.Name,
			XPosition: ht.XPosition,
			YPosition: ht.YPosition,
			Order:     ht.OrderIndex,
			Dialogues: dialogueDTOs,
		}
	}

	res := dto.Scene{
		ID:                 string(createdScene.ID),
		Title:              createdScene.Title,
		Description:        createdScene.Description,
		BackgroundImageURL: createdScene.BackgroundImageURL,
		Difficulty:         string(createdScene.Difficulty),
		Category:           createdScene.Category,
		Hotspots:           hotspotDTOs,
	}

	return c.JSON(http.StatusCreated, res)
}

// ListCustomScenes لیست صحنه‌های اختصاصی ساخته‌شده توسط همین کاربر
func (h Handler) ListCustomScenes(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت نامعتبر است"})
	}

	list, err := h.customSceneSvc.ListUserCustomScenes(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	dtoList := make([]dto.Scene, len(list))
	for i, sc := range list {
		dtoList[i] = dto.Scene{
			ID:                 string(sc.ID),
			Title:              sc.Title,
			Description:        sc.Description,
			BackgroundImageURL: sc.BackgroundImageURL,
			Difficulty:         string(sc.Difficulty),
			Category:           sc.Category,
			Hotspots:           []dto.Hotspot{},
		}
	}

	return c.JSON(http.StatusOK, echo.Map{"scenes": dtoList})
}

// DeleteCustomScene حذف یک صحنه اختصاصی توسط سازنده آن
func (h Handler) DeleteCustomScene(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت نامعتبر است"})
	}

	sceneID := c.Param("sceneID")
	if err := h.customSceneSvc.DeleteUserCustomScene(c.Request().Context(), userClaims.UserID, sceneID); err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "صحنه اختصاصی با موفقیت حذف شد"})
}

func fmtFileName(base, ext string) string {
	if ext == "" {
		return base
	}
	if !strings.HasPrefix(ext, ".") {
		ext = "." + ext
	}
	return base + ext
}

