package speecheval

import (
	"context"
	"os"
	"testing"
)

// تست یکپارچه: کل زنجیره‌ی ffmpeg → سرویس whisper → نمره‌دهی را با فایل صوتی
// واقعی می‌آزماید. چون به سرویس بیرونی نیاز دارد، فقط وقتی اجرا می‌شود که
// هر دو متغیر محیطی ست شده باشند:
//
//	WHISPER_TEST_URL=http://localhost:9000 \
//	WHISPER_TEST_AUDIO_DIR=/path/to/clips \
//	go test ./internal/service/speecheval/ -run Integration -v
//
// فایل‌های مورد انتظار در آن پوشه: clean.webm, missing.webm, rambling.webm,
// slow.webm, silence.webm — همه با متن مرجع integrationTarget.
const integrationTarget = "I would like a cup of coffee please"

func integrationSetup(t *testing.T) (*WhisperEvaluator, string) {
	t.Helper()

	url := os.Getenv("WHISPER_TEST_URL")
	dir := os.Getenv("WHISPER_TEST_AUDIO_DIR")
	if url == "" || dir == "" {
		t.Skip("set WHISPER_TEST_URL and WHISPER_TEST_AUDIO_DIR to run integration tests")
	}

	e := NewWhisperEvaluator(url)
	if !e.client.Healthy(context.Background()) {
		t.Fatalf("whisper service at %s is not healthy", url)
	}
	return e, dir
}

// referenceSeconds مدت صدای مرجع برای integrationTarget. کلیپ‌ها با TTS
// ساخته شده‌اند و خواندن تمیزِ این جمله حدود ۲ ثانیه طول می‌کشد؛ روانی نسبت
// به همین سنجیده می‌شود.
const referenceSeconds = 2

// evaluateClip یک کلیپ را از مسیر کامل ارزیابی می‌کند و اگر ناچار به fallback
// شده باشد تست را می‌شکند — چون کل هدف این تست، آزمودن مسیر واقعی است.
func evaluateClip(t *testing.T, e *WhisperEvaluator, dir, name string, duration int) EvaluationResult {
	t.Helper()

	got := e.Evaluate(context.Background(), Input{
		TargetText:              integrationTarget,
		AudioPath:               dir + "/" + name,
		DurationSeconds:         duration,
		ExpectedDurationSeconds: referenceSeconds,
	})
	if got.Estimated {
		t.Fatalf("%s: fell back to estimate — the real pipeline did not run", name)
	}

	t.Logf("%-14s pron=%-6v fluency=%-6v overall=%-6v transcript=%q",
		name, got.PronunciationScore, got.FluencyScore, got.OverallScore, got.Transcript)
	for _, w := range got.Words {
		if w.Status != WordOK {
			t.Logf("     %-10s %-8s score=%v heard=%q", w.Word, w.Status, w.Score, w.Heard)
		}
	}
	return got
}

func TestIntegration_CleanReadScoresHigh(t *testing.T) {
	e, dir := integrationSetup(t)

	got := evaluateClip(t, e, dir, "clean.webm", 2)

	if got.PronunciationScore < 85 {
		t.Errorf("clean read should score >=85, got %v (%q)", got.PronunciationScore, got.Transcript)
	}
	for _, w := range got.Words {
		if w.Status == WordMissing {
			t.Errorf("clean read marked %q as missing", w.Word)
		}
	}
}

func TestIntegration_SilenceScoresZero(t *testing.T) {
	e, dir := integrationSetup(t)

	// همان حالتی که پیاده‌سازی قبلی نمره‌ی ۸۵ می‌داد.
	got := evaluateClip(t, e, dir, "silence.webm", 4)

	if got.OverallScore != 0 {
		t.Errorf("silence must score 0, got %v (transcript %q)", got.OverallScore, got.Transcript)
	}
}

func TestIntegration_DroppedWordIsCaught(t *testing.T) {
	e, dir := integrationSetup(t)

	clean := evaluateClip(t, e, dir, "clean.webm", 2)
	got := evaluateClip(t, e, dir, "missing.webm", 2)

	var cupMissing bool
	for _, w := range got.Words {
		if w.Word == "cup" && w.Status == WordMissing {
			cupMissing = true
		}
	}
	if !cupMissing {
		t.Errorf("dropped word 'cup' not flagged; words=%+v", got.Words)
	}
	if got.PronunciationScore >= clean.PronunciationScore {
		t.Errorf("dropped word must cost points: got %v vs clean %v",
			got.PronunciationScore, clean.PronunciationScore)
	}
}

func TestIntegration_RamblingScoresLower(t *testing.T) {
	e, dir := integrationSetup(t)

	clean := evaluateClip(t, e, dir, "clean.webm", 2)
	got := evaluateClip(t, e, dir, "rambling.webm", 3)

	if got.PronunciationScore >= clean.PronunciationScore {
		t.Errorf("extra words must cost points: got %v vs clean %v",
			got.PronunciationScore, clean.PronunciationScore)
	}
}

func TestIntegration_SlowHaltingScoresLowerFluency(t *testing.T) {
	e, dir := integrationSetup(t)

	clean := evaluateClip(t, e, dir, "clean.webm", 2)
	got := evaluateClip(t, e, dir, "slow.webm", 4)

	if got.FluencyScore >= clean.FluencyScore {
		t.Errorf("slow halting speech must score lower fluency: got %v vs clean %v",
			got.FluencyScore, clean.FluencyScore)
	}
}
