package speecheval

import (
	"context"
	"log/slog"
	"os"
	"strings"

	"shadowing-backend/internal/pkg/audio"
)

// WhisperEvaluator - نمره‌دهی تلفظ با تشخیص گفتار روی سرور خودمان.
//
// مسیر کار: فایل ضبط‌شده → ffmpeg (WAV 16k mono) → سرویس whisper → مقایسه‌ی
// کلمه‌به‌کلمه‌ی متن شنیده‌شده با متن هدف.
//
// اگر هر جای این زنجیره خراب شود (ffmpeg نصب نیست، سرویس بالا نیست، شبکه قطع
// است) به‌جای خطا دادن به کاربر، به HybridEvaluator تخمینی برمی‌گردد و نتیجه
// با Estimated=true علامت می‌خورد.
type WhisperEvaluator struct {
	client   *WhisperClient
	fallback *HybridEvaluator
}

func NewWhisperEvaluator(baseURL string) *WhisperEvaluator {
	return &WhisperEvaluator{
		client:   NewWhisperClient(baseURL),
		fallback: NewHybridEvaluator(),
	}
}

// Evaluate - محاسبه نمره‌ی تلفظ، روانی و کلمه‌به‌کلمه از روی صدای واقعی
func (e *WhisperEvaluator) Evaluate(ctx context.Context, in Input) EvaluationResult {
	result, err := e.evaluateWithAudio(ctx, in)
	if err != nil {
		slog.Warn("speech evaluation fell back to estimate", "err", err)
		return e.fallback.Evaluate(ctx, in)
	}
	return *result
}

func (e *WhisperEvaluator) evaluateWithAudio(ctx context.Context, in Input) (*EvaluationResult, error) {
	if in.AudioPath == "" {
		return nil, errNoAudio
	}
	if strings.TrimSpace(in.TargetText) == "" {
		return nil, errNoTarget
	}

	// ۱️⃣ تبدیل به فرمتی که مدل می‌فهمد
	wavPath, err := audio.ToWAV16kMono(ctx, in.AudioPath)
	if err != nil {
		return nil, err
	}
	defer os.Remove(wavPath)

	// ۲️⃣ تشخیص گفتار
	tr, err := e.client.Transcribe(ctx, wavPath, in.TargetText)
	if err != nil {
		return nil, err
	}

	return e.score(in, tr), nil
}

// score نتیجه‌ی تشخیص گفتار را به نمره تبدیل می‌کند.
func (e *WhisperEvaluator) score(in Input, tr *TranscriptionResult) *EvaluationResult {
	targetRaw := strings.Fields(in.TargetText)
	target := normalizeWords(in.TargetText)
	heard := normalizeWords(tr.Text)

	// سکوت محض یا صدای نامفهوم: مهم‌ترین حالتی که پیاده‌سازی قبلی اشتباه
	// می‌گرفت (به سکوت هم نمره‌ی ۸۵ می‌داد).
	if len(heard) == 0 || len(target) == 0 {
		return &EvaluationResult{
			PronunciationScore: 0,
			FluencyScore:       0,
			OverallScore:       0,
			Transcript:         tr.Text,
			Words:              allMissing(targetRaw, target),
		}
	}

	words := scoreWords(targetRaw, target, heard, tr.Words)

	// ۱️⃣ نمره‌ی تلفظ: میانگین نمره‌ی کلمه‌های هدف
	total := 0.0
	for _, w := range words {
		total += w.Score
	}
	pronunciation := total / float64(len(words))

	// جریمه‌ی کلمه‌های اضافه: اگر کاربر خیلی بیشتر از متن حرف زده، یعنی
	// جمله را درست نگفته حتی اگر همه‌ی کلمه‌های هدف جایی داخلش باشند.
	if extra := len(heard) - len(target); extra > 0 {
		ratio := float64(extra) / float64(len(target))
		pronunciation -= clamp(ratio*30, 0, 25)
	}
	pronunciation = clamp(pronunciation, 0, 100)

	// ۲️⃣ نمره‌ی روانی از زمان‌بندی واقعی کلمه‌ها
	fluency := fluencyFromTimings(tr.Words, in.ExpectedDurationSeconds)
	if len(tr.Words) == 0 {
		// اگر زمان‌بندی کلمه‌ای نداشتیم به همان ریتم کلی برمی‌گردیم
		fluency = e.fallback.Evaluate(context.Background(), in).FluencyScore
	}

	// روانی از روی زمان‌بندیِ همان صدایی حساب می‌شود که شنیده شده، صرف‌نظر از
	// اینکه محتوایش با متن هدف می‌خواند یا نه. اگر کاربر جمله‌ی کاملاً دیگری
	// گفته باشد، آن زمان‌بندی به‌دردنخور است و نباید نمره‌ی روانی بالا بدهد؛
	// پس با نسبت کلمه‌های واقعاً تطبیق‌یافته (غیر missing) مقیاس می‌شود.
	matched := 0
	for _, w := range words {
		if w.Status != WordMissing {
			matched++
		}
	}
	matchRatio := float64(matched) / float64(len(words))
	fluency *= matchRatio

	// ۳️⃣ نمره‌ی کل — وزن تلفظ بیشتر است چون هدفِ اصلی تمرین شدوئینگ است
	overall := pronunciation*0.6 + fluency*0.4

	return &EvaluationResult{
		PronunciationScore: round1(pronunciation),
		FluencyScore:       round1(fluency),
		OverallScore:       round1(overall),
		Transcript:         tr.Text,
		Words:              words,
	}
}

// allMissing وقتی هیچ چیزی شنیده نشده، همه‌ی کلمه‌های هدف را قرمز برمی‌گرداند.
func allMissing(targetRaw, target []string) []WordScore {
	out := make([]WordScore, len(target))
	for i := range target {
		raw := target[i]
		if i < len(targetRaw) {
			raw = targetRaw[i]
		}
		out[i] = WordScore{Word: raw, Index: i, Score: 0, Status: WordMissing}
	}
	return out
}

type evalError string

func (e evalError) Error() string { return string(e) }

const (
	errNoAudio  = evalError("no audio file provided")
	errNoTarget = evalError("no target text provided")
)
