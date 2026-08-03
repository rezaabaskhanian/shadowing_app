package learningservice

import (
	scene "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/learning/dto"
)

// toDifficulty رشته‌ی سطح سختی را به نوع دامین تبدیل می‌کند.
func toDifficulty(op richerror.Op, v string) (scene.DifficultyLevel, error) {
	switch v {
	case "beginner":
		return scene.DifficultyBeginner, nil
	case "intermediate":
		return scene.DifficultyIntermediate, nil
	case "advanced":
		return scene.DifficultyAdvanced, nil
	default:
		return "", richerror.New(op).
			WithMessage("سطح سختی نامعتبر است. مقادیر مجاز: beginner, intermediate, advanced").
			WithKind(richerror.KindForbidden)
	}
}

// toSpeaker رشته‌ی گوینده را به نوع دامین تبدیل می‌کند.
func toSpeaker(op richerror.Op, v string) (scene.SpeakerType, error) {
	if v == "" {
		return "", richerror.New(op).
			WithMessage("نام گوینده الزامی است").
			WithKind(richerror.KindForbidden)
	}
	return scene.SpeakerType(v), nil
}

// toDisplay رشته‌ی نوع نمایش را به نوع دامین تبدیل می‌کند.
func toDisplay(op richerror.Op, v string) (scene.DisplayType, error) {
	switch v {
	case "full":
		return scene.DisplayFull, nil
	case "partial":
		return scene.DisplayPartial, nil
	case "none":
		return scene.DisplayNone, nil
	default:
		return "", richerror.New(op).
			WithMessage("نوع نمایش نامعتبر است. مقادیر مجاز: full, partial, none").
			WithKind(richerror.KindForbidden)
	}
}

// buildHotspots هات‌اسپات‌های ورودی (DTO) را به هات‌اسپات‌های دامین همراه با دیالوگ‌هایشان
// تبدیل می‌کند. برای هر هات‌اسپات و دیالوگ شناسه‌ی جدید ساخته می‌شود.
func buildHotspots(op richerror.Op, reqHotspots []dto.Hotspot) ([]scene.Hotspot, error) {
	hotspots := make([]scene.Hotspot, 0, len(reqHotspots))

	for _, hReq := range reqHotspots {
		hotspot := scene.NewHotspot(
			hReq.Name,
			hReq.XPosition,
			hReq.YPosition,
			hReq.Order,
		)

		for _, dReq := range hReq.Dialogues {
			speaker, err := toSpeaker(op, dReq.Speaker)
			if err != nil {
				return nil, err
			}

			displayType, err := toDisplay(op, dReq.DisplayType)
			if err != nil {
				return nil, err
			}

			dialog, err := scene.NewDialogue(
				hotspot.ID,
				dReq.Order,
				speaker,
				dReq.OriginalText,
				dReq.Translation,
				displayType,
			)
			if err != nil {
				return nil, richerror.New(op).
					WithErr(err).
					WithMessage("خطا در ساخت دیالوگ").
					WithKind(richerror.KindForbidden)
			}

			if dReq.AudioURL != "" {
				dialog.AudioURL = dReq.AudioURL
			}
			if dReq.PartialHint != "" {
				dialog.PartialHint = dReq.PartialHint
			}
			if dReq.WaitDuration > 0 {
				dialog.WaitDuration = dReq.WaitDuration
			}

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

			hotspot.AddDialogue(dialog)
		}

		hotspots = append(hotspots, hotspot)
	}

	return hotspots, nil
}
