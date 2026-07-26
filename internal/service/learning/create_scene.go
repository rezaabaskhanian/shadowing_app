package learningservice

import (
	"context"
	"time"

	scene "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/learning/dto"
)

func (s Service) CreateScene(ctx context.Context, req dto.CreateSceneRequest) (dto.Scene, error) {

	const op = "learningservice.Create"

	// ========== 1️⃣ اعتبارسنجی ورودی ==========
	if req.Title == "" {
		return dto.Scene{}, richerror.New(op).
			WithMessage("عنوان سناریو الزامی است").
			WithKind(richerror.KindForbidden)
	}

	if req.BackgroundImageURL == "" {
		return dto.Scene{}, richerror.New(op).
			WithMessage("آدرس تصویر پس‌زمینه الزامی است").
			WithKind(richerror.KindForbidden)
	}

	if len(req.Hotspots) == 0 {
		return dto.Scene{}, richerror.New(op).
			WithMessage("حداقل یک هات‌اسپات باید وجود داشته باشد").
			WithKind(richerror.KindForbidden)
	}

	// ========== 2️⃣ تبدیل Difficulty به نوع دامین ==========
	var difficultyLevel scene.DifficultyLevel
	switch req.Difficulty {
	case "beginner":
		difficultyLevel = scene.DifficultyBeginner
	case "intermediate":
		difficultyLevel = scene.DifficultyIntermediate
	case "advanced":
		difficultyLevel = scene.DifficultyAdvanced
	default:
		return dto.Scene{}, richerror.New(op).
			WithMessage("سطح سختی نامعتبر است. مقادیر مجاز: beginner, intermediate, advanced").
			WithKind(richerror.KindForbidden)
	}

	// ========== 3️⃣ ساخت Entity Scene ==========
	newScene, err := scene.NewScene(
		req.Title,
		req.Description,
		req.BackgroundImageURL,
		difficultyLevel,
	)
	if err != nil {
		return dto.Scene{}, richerror.New(op).
			WithErr(err).
			WithMessage("خطا در ساخت سناریو").
			WithKind(richerror.KindForbidden)
	}

	// ========== 4️⃣ اضافه کردن هات‌اسپات‌ها با دیالوگ‌ها ==========
	for _, hReq := range req.Hotspots {
		// ساخت هات‌اسپات
		hotspot := scene.NewHotspot(
			hReq.Name,
			hReq.XPosition,
			hReq.YPosition,
			hReq.Order,
		)

		// اضافه کردن دیالوگ‌ها به هات‌اسپات
		for _, dReq := range hReq.Dialogues {
			// تبدیل Speaker به نوع دامین
			var speaker scene.SpeakerType
			switch dReq.Speaker {
			case "customer":
				speaker = scene.SpeakerCustomer
			case "clerk":
				speaker = scene.SpeakerClerk
			case "npc":
				speaker = scene.SpeakerNPC
			default:
				return dto.Scene{}, richerror.New(op).
					WithMessage("نوع گوینده نامعتبر است. مقادیر مجاز: customer, clerk, npc").
					WithKind(richerror.KindForbidden)
			}

			// تبدیل DisplayType به نوع دامین
			var displayType scene.DisplayType
			switch dReq.DisplayType {
			case "full":
				displayType = scene.DisplayFull
			case "partial":
				displayType = scene.DisplayPartial
			case "none":
				displayType = scene.DisplayNone
			default:
				return dto.Scene{}, richerror.New(op).
					WithMessage("نوع نمایش نامعتبر است. مقادیر مجاز: full, partial, none").
					WithKind(richerror.KindForbidden)
			}

			// ساخت دیالوگ
			dialog, err := scene.NewDialogue(
				hotspot.ID,
				dReq.Order,
				speaker,
				dReq.OriginalText,
				dReq.Translation,
				displayType,
			)
			if err != nil {
				return dto.Scene{}, richerror.New(op).
					WithErr(err).
					WithMessage("خطا در ساخت دیالوگ").
					WithKind(richerror.KindForbidden)
			}

			// تنظیمات اختیاری
			if dReq.AudioURL != "" {
				dialog.AudioURL = dReq.AudioURL
			}
			if dReq.PartialHint != "" {
				dialog.PartialHint = dReq.PartialHint
			}
			if dReq.WaitDuration > 0 {
				dialog.WaitDuration = dReq.WaitDuration
			}

			// واژه‌های دیالوگ (انگلیسی + معنی)
			if len(dReq.Words) > 0 {
				words := make([]scene.DialogueWord, 0, len(dReq.Words))
				for _, w := range dReq.Words {
					if w.Word == "" {
						continue
					}
					words = append(words, scene.DialogueWord{Word: w.Word, Meaning: w.Meaning})
				}
				dialog.Words = words
			}

			// ✅ اضافه کردن دیالوگ به هات‌اسپات
			hotspot.AddDialogue(dialog)
		}

		// ✅ اضافه کردن هات‌اسپات به سناریو
		newScene.AddHotspot(hotspot)
	}

	// ========== 5️⃣ ذخیره در دیتابیس ==========
	err = s.repo.Create(ctx, newScene)
	if err != nil {
		return dto.Scene{}, richerror.New(op).
			WithErr(err).
			WithMessage("خطا در ذخیره سناریو").
			WithKind(richerror.KindUnexpected)
	}

	// ========== 6️⃣ تبدیل به DTO ==========
	return toSceneDTO(newScene), nil

}

// ========== تابع کمکی تبدیل ==========
func toSceneDTO(s scene.Scene) dto.Scene {
	hotspots := make([]dto.Hotspot, len(s.Hotspots))

	for i, h := range s.Hotspots {
		// تبدیل دیالوگ‌های هر هات‌اسپات
		dialogues := make([]dto.Dialogue, len(h.Dialogues))
		for j, d := range h.Dialogues {
			dialogues[j] = dto.Dialogue{
				ID:           string(d.ID),
				Order:        d.Order,
				Speaker:      string(d.Speaker),
				OriginalText: d.OriginalText,
				Translation:  d.Translation,
				AudioURL:     d.AudioURL,
				DisplayType:  string(d.DisplayType),
				PartialHint:  d.PartialHint,
				WaitDuration: d.WaitDuration,
				Words:        toWordDTOs(d.Words),
			}
		}

		hotspots[i] = dto.Hotspot{
			ID:        string(h.ID),
			Name:      h.Name,
			XPosition: h.XPosition,
			YPosition: h.YPosition,
			Order:     h.OrderIndex,
			Dialogues: dialogues, // ✅ دیالوگ‌ها اضافه شدند
		}
	}

	return dto.Scene{
		ID:                 string(s.ID),
		Title:              s.Title,
		Description:        s.Description,
		BackgroundImageURL: s.BackgroundImageURL,
		Difficulty:         string(s.Difficulty),
		Status:             string(s.Status),
		Hotspots:           hotspots,
		Order:              s.Order,
		CreatedAt:          s.CreatedAt.Format(time.RFC3339),
		UpdatedAt:          s.UpdatedAt.Format(time.RFC3339),
	}
}

// toWordDTOs واژه‌های دامنه را به DTO تبدیل می‌کند (همیشه آرایه‌ی غیرnil برمی‌گرداند).
func toWordDTOs(ws []scene.DialogueWord) []dto.Word {
	out := make([]dto.Word, 0, len(ws))
	for _, w := range ws {
		out = append(out, dto.Word{Word: w.Word, Meaning: w.Meaning})
	}
	return out
}
