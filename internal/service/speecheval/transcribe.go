package speecheval

import (
	"context"
	"os"

	"shadowing-backend/internal/pkg/audio"
)

// errTranscriptionUnavailable برای HybridEvaluator: بدون کلاینت whisper، هیچ
// رونویسی واقعی ممکن نیست — بر خلاف Evaluate که تخمین برمی‌گرداند، اینجا
// دروغین جایگزینی برای متن رونویسی وجود ندارد، پس فقط خطا برمی‌گردانیم.
const errTranscriptionUnavailable = evalError("transcription service unavailable")

// Transcriber - رونویسی خام صدا بدون نمره‌دهی، برای جاهایی که متن هدف مشخصی
// برای مقایسه وجود ندارد (مثل آیتم‌های free_speech تست تعیین سطح).
type Transcriber interface {
	TranscribeOnly(ctx context.Context, audioPath string) (string, error)
}

// EvaluatorTranscriber - هم نمره‌دهی معمول شدوئینگ و هم رونویسی خام.
type EvaluatorTranscriber interface {
	Evaluator
	Transcriber
}

// TranscribeOnly فقط تشخیص گفتار را انجام می‌دهد، بدون نمره‌دهی. targetText
// در Transcribe فقط یک راهنمای واژگان اختیاری است (whisper_client.go)، پس
// خالی فرستادنش مشکلی ندارد.
func (e *WhisperEvaluator) TranscribeOnly(ctx context.Context, audioPath string) (string, error) {
	if audioPath == "" {
		return "", errNoAudio
	}

	wavPath, err := audio.ToWAV16kMono(ctx, audioPath)
	if err != nil {
		return "", err
	}
	defer os.Remove(wavPath)

	tr, err := e.client.Transcribe(ctx, wavPath, "")
	if err != nil {
		return "", err
	}
	return tr.Text, nil
}

// TranscribeOnly - بدون کلاینت whisper، رونویسی واقعی ممکن نیست.
func (e *HybridEvaluator) TranscribeOnly(ctx context.Context, audioPath string) (string, error) {
	return "", errTranscriptionUnavailable
}
