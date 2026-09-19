package speecheval

import (
	"context"
	"log/slog"
	"os"
	"time"

	"shadowing-backend/internal/pkg/audio"
)

// maxTranscribeSeconds سقفِ سختِ طولِ صدایی است که برای رونویسیِ خام به Whisper
// می‌رسد. اپ خودش ضبط را روی ۲۰ ثانیه می‌بندد؛ این ۲ ثانیه‌ی اضافه فقط حاشیه‌ی
// تأخیرِ توقفِ ضبط است، تا صدای یک کاربرِ عادی هیچ‌وقت وسطِ جمله بریده نشود.
const maxTranscribeSeconds = 22

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

	convertStart := time.Now()
	wavPath, err := audio.ToWAV16kMonoMax(ctx, audioPath, maxTranscribeSeconds)
	if err != nil {
		return "", err
	}
	defer os.Remove(wavPath)
	convertDur := time.Since(convertStart)

	whisperStart := time.Now()
	tr, err := e.client.TranscribeText(ctx, wavPath)
	if err != nil {
		return "", err
	}

	// لاگِ زمان‌بندی: برای اینکه معلوم شود کندیِ «توضیح آزاد»/«گفتگو با AI» از
	// ffmpeg است یا Whisper، نه حدس.
	slog.Info("speecheval: transcribe timing",
		"convert_ms", convertDur.Milliseconds(),
		"whisper_ms", time.Since(whisperStart).Milliseconds(),
		"audio_seconds", tr.Duration,
		"chars", len(tr.Text),
	)
	return tr.Text, nil
}

// TranscribeOnly - بدون کلاینت whisper، رونویسی واقعی ممکن نیست.
func (e *HybridEvaluator) TranscribeOnly(ctx context.Context, audioPath string) (string, error) {
	return "", errTranscriptionUnavailable
}
