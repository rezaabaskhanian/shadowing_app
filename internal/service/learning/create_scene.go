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
	difficultyLevel, err := toDifficulty(op, req.Difficulty)
	if err != nil {
		return dto.Scene{}, err
	}

	// ========== 3️⃣ ساخت Entity Scene ==========
	newScene, err := scene.NewScene(
		req.Title,
		req.Description,
		req.BackgroundImageURL,
		difficultyLevel,
		req.IsLocked,
		req.Category,
	)
	if err != nil {
		return dto.Scene{}, richerror.New(op).
			WithErr(err).
			WithMessage("خطا در ساخت سناریو").
			WithKind(richerror.KindForbidden)
	}

	// ========== 4️⃣ اضافه کردن هات‌اسپات‌ها با دیالوگ‌ها ==========
	hotspots, err := s.buildHotspots(ctx, op, req.Hotspots)
	if err != nil {
		return dto.Scene{}, err
	}
	for _, h := range hotspots {
		newScene.AddHotspot(h)
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
				WordTimings:  toWordTimingDTOs(d.WordTimings),
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
		IsLocked:           s.IsLocked,
		Category:           s.Category,
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

// toWordTimingDTOs زمان‌بندی کلمه‌های دامنه را به DTO تبدیل می‌کند. اگر
// تشخیص گفتار برای این دیالوگ اجرا نشده باشد nil برمی‌گرداند (نه آرایه‌ی
// خالی) تا در JSON اصلاً فیلد word_timings نمایش داده نشود.
func toWordTimingDTOs(ws []scene.WordTiming) []dto.WordTiming {
	if len(ws) == 0 {
		return nil
	}
	out := make([]dto.WordTiming, 0, len(ws))
	for _, w := range ws {
		out = append(out, dto.WordTiming{Word: w.Word, Start: w.Start, End: w.End})
	}
	return out
}
