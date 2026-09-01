package learningservice

import (
	"context"
	"fmt"
	"path/filepath"

	scene "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/learning/dto"
	"shadowing-backend/internal/service/speecheval"
)

// toDifficulty رشته‌ی سطح زبان‌آموز را به نوع دامین تبدیل می‌کند.
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
			WithMessage("سطح زبان‌آموز نامعتبر است. مقادیر مجاز: beginner, intermediate, advanced").
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
//
// تشخیص گفتار روی صدای مرجع اینجا اجرا نمی‌شود — این کار می‌تواند چندین
// ثانیه تا چند دقیقه طول بکشد (به‌خصوص وقتی whisper-service زیر فشار است)
// و اگر همین‌جا و به‌صورت همزمان با request انجام شود، درخواست ذخیره‌ی
// صحنه در پنل ادمین را کند یا با تایم‌اوت پراکسی ناموفق می‌کند. به‌جایش
// CreateScene/UpdateScene بعد از ذخیره‌ی موفق در دیتابیس، این کار را در
// پس‌زمینه با processWordTimingsAsync انجام می‌دهند.
func (s Service) buildHotspots(ctx context.Context, op richerror.Op, reqHotspots []dto.Hotspot) ([]scene.Hotspot, error) {
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

// transcribeReferenceAudio زمان‌بندی کلمه‌به‌کلمه‌ی فایل صوتی مرجع را از
// whisper-service می‌گیرد. audioURL همیشه به شکل «<publicPath>/<filename>»
// است (بدون زیرپوشه — نگاه کنید به generate_audio.go/upload_audio.go)، پس
// نام فایل همان بخش آخر URL و مسیر دیسک آن uploadDir/filename است.
func (s Service) transcribeReferenceAudio(ctx context.Context, audioURL, text string) []scene.WordTiming {
	if s.whisperURL == "" || text == "" {
		return nil
	}

	client := speecheval.NewWhisperClient(s.whisperURL)
	localPath := filepath.Join(s.uploadDir, filepath.Base(audioURL))

	result, err := client.Transcribe(ctx, localPath, text)
	if err != nil {
		fmt.Println("warning: reference audio transcription failed for", audioURL, "-", err)
		return nil
	}

	timings := make([]scene.WordTiming, 0, len(result.Words))
	for _, w := range result.Words {
		timings = append(timings, scene.WordTiming{Word: w.Word, Start: w.Start, End: w.End})
	}
	return timings
}

// processWordTimingsAsync زمان‌بندی کلمه‌به‌کلمه‌ی صدای مرجع همه‌ی دیالوگ‌های
// دارای audio_url را در پس‌زمینه (بعد از پاسخ به request) محاسبه و در
// دیتابیس ذخیره می‌کند. باید با go s.processWordTimingsAsync(...) فراخوانی
// شود؛ context.Background می‌گیرد چون context درخواست HTTP با پایان یافتن
// پاسخ لغو می‌شود. تماس‌ها عمداً سریالی هستند (نه موازی) تا فشار همزمان
// روی whisper-service محدود کم‌منابع بالا نرود.
func (s Service) processWordTimingsAsync(hotspots []scene.Hotspot) {
	if s.whisperURL == "" {
		return
	}

	ctx := context.Background()
	for _, h := range hotspots {
		for _, d := range h.Dialogues {
			if d.AudioURL == "" || d.OriginalText == "" {
				continue
			}

			timings := s.transcribeReferenceAudio(ctx, d.AudioURL, d.OriginalText)
			if len(timings) == 0 {
				continue
			}

			if err := s.repo.UpdateDialogueWordTimings(ctx, string(d.ID), timings); err != nil {
				fmt.Println("warning: failed to save word timings for dialogue", d.ID, "-", err)
			}
		}
	}
}
