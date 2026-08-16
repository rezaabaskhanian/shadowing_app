package shadowingservice

import (
	"context"
	"log/slog"
	"os"
	"strings"

	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/shadowing/dto"
	"shadowing-backend/internal/service/speecheval"

	"github.com/google/uuid"
)

// EvaluateRecording یک ضبط را فقط نمره می‌دهد، بدون هیچ state ای.
//
// چرا جدا از SubmitRecording؟ چون آن یکی جلسه‌محور است: فقط روی مرحله‌ی ۲ یا ۳
// کار می‌کند و هر ضبط، مرحله را تمام‌شده علامت می‌زند و جلو می‌برد. تمرین در
// اپ اما آزاد است — کاربر بین مرحله‌ها می‌پرد و هر جمله را هرچندبار که بخواهد
// دوباره ضبط می‌کند. این تابع همان ارزیاب را صدا می‌زند ولی چیزی را جابه‌جا
// یا ذخیره نمی‌کند، پس بی‌محدودیت قابل فراخوانی است.
func (s Service) EvaluateRecording(ctx context.Context, req dto.EvaluateRecordingRequest) (*dto.EvaluateRecordingResponse, error) {
	const op = "shadowing.EvaluateRecording"

	// فایل صوتی فقط برای نمره‌دهی آمده؛ در هر مسیر خروجی پاک می‌شود.
	if req.LocalAudioPath != "" {
		defer func() {
			if err := os.Remove(req.LocalAudioPath); err != nil && !os.IsNotExist(err) {
				slog.Warn("could not remove temporary recording", "path", req.LocalAudioPath, "err", err)
			}
		}()
	}

	// متن هدف یا مستقیم آمده یا باید از روی دیالوگ خوانده شود. حالت دوم
	// مطمئن‌تر است چون کلاینت نمی‌تواند متن را دستکاری کند.
	targetText := strings.TrimSpace(req.TargetText)
	expected := req.ExpectedDuration

	if req.DialogueID != "" {
		dialogueID, err := uuid.Parse(req.DialogueID)
		if err != nil {
			return nil, richerror.New(op).WithErr(err).
				WithMessage("invalid dialogue ID").
				WithKind(richerror.KindInvalid)
		}

		dialogue, err := s.dialogueRepo.GetDialogueByID(ctx, dialogueID)
		if err != nil {
			return nil, richerror.New(op).WithErr(err).WithMessage("dialogue not found")
		}

		targetText = dialogue.OriginalText
		if expected <= 0 {
			expected = dialogue.WaitDuration
		}
	}

	if targetText == "" {
		return nil, richerror.New(op).
			WithMessage("either dialogue_id or target_text is required").
			WithKind(richerror.KindInvalid)
	}

	result := s.evaluator.Evaluate(ctx, speecheval.Input{
		TargetText:              targetText,
		AudioPath:               req.LocalAudioPath,
		DurationSeconds:         req.Duration,
		ExpectedDurationSeconds: expected,
	})

	return &dto.EvaluateRecordingResponse{
		TargetText:         targetText,
		PronunciationScore: result.PronunciationScore,
		FluencyScore:       result.FluencyScore,
		OverallScore:       result.OverallScore,
		Transcript:         result.Transcript,
		IsEstimated:        result.Estimated,
		Words:              toDTOWordScores(result.Words),
	}, nil
}
