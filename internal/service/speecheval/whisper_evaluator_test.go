package speecheval

import (
	"strings"
	"testing"
)

// heardFrom یک نتیجه‌ی تشخیص گفتار ساختگی می‌سازد: کلمه‌ها با فاصله‌ی زمانی
// یکنواخت و اطمینان یکسان. برای تست‌هایی که زمان‌بندی برایشان مهم نیست.
func heardFrom(text string, prob float64, secondsPerWord float64) *TranscriptionResult {
	fields := strings.Fields(text)
	words := make([]HeardWord, 0, len(fields))
	t := 0.0
	for _, f := range fields {
		words = append(words, HeardWord{
			Word:        f,
			Start:       t,
			End:         t + secondsPerWord,
			Probability: prob,
		})
		t += secondsPerWord
	}
	return &TranscriptionResult{Text: text, Words: words, Duration: t}
}

const target = "I would like a cup of coffee please"

func TestScore_Silence(t *testing.T) {
	e := NewWhisperEvaluator("http://unused")
	in := Input{TargetText: target, DurationSeconds: 4, ExpectedDurationSeconds: 4}

	got := e.score(in, &TranscriptionResult{Text: "", Words: nil})

	// این دقیقاً همان چیزی است که پیاده‌سازی قبلی اشتباه می‌گرفت: به سکوت
	// نمره‌ی ۸۵ می‌داد.
	if got.OverallScore != 0 || got.PronunciationScore != 0 {
		t.Fatalf("silence must score zero, got overall=%v pron=%v", got.OverallScore, got.PronunciationScore)
	}
	if len(got.Words) != len(strings.Fields(target)) {
		t.Fatalf("expected every target word marked, got %d", len(got.Words))
	}
	for _, w := range got.Words {
		if w.Status != WordMissing {
			t.Fatalf("word %q should be missing, got %s", w.Word, w.Status)
		}
	}
}

func TestScore_PerfectMatch(t *testing.T) {
	e := NewWhisperEvaluator("http://unused")
	in := Input{TargetText: target, DurationSeconds: 4, ExpectedDurationSeconds: 4}

	got := e.score(in, heardFrom(target, 0.95, 0.5))

	if got.PronunciationScore < 90 {
		t.Fatalf("clean read should score high, got %v", got.PronunciationScore)
	}
	for _, w := range got.Words {
		if w.Status != WordOK {
			t.Fatalf("word %q should be ok, got %s (score %v)", w.Word, w.Status, w.Score)
		}
	}
}

func TestScore_MissingWordIsRed(t *testing.T) {
	e := NewWhisperEvaluator("http://unused")
	in := Input{TargetText: target, DurationSeconds: 4, ExpectedDurationSeconds: 4}

	// "cup" جا افتاده — بقیه‌ی کلمه‌ها نباید به‌خاطر جابه‌جایی اندیس خراب شوند.
	got := e.score(in, heardFrom("I would like a of coffee please", 0.95, 0.5))

	missing := map[string]bool{}
	for _, w := range got.Words {
		if w.Status == WordMissing {
			missing[strings.ToLower(w.Word)] = true
		}
	}

	if !missing["cup"] {
		t.Fatalf("dropped word 'cup' should be marked missing, got %+v", got.Words)
	}
	if len(missing) != 1 {
		t.Fatalf("only 'cup' should be missing, got %v", missing)
	}
	if got.PronunciationScore >= 95 {
		t.Fatalf("a dropped word must cost points, got %v", got.PronunciationScore)
	}
}

func TestScore_MispronouncedWordIsWeakNotMissing(t *testing.T) {
	e := NewWhisperEvaluator("http://unused")
	in := Input{TargetText: "beautiful weather today", DurationSeconds: 3, ExpectedDurationSeconds: 3}

	// تلفظ بد یک کلمه نباید مثل «اصلاً نگفتن» حساب شود.
	got := e.score(in, heardFrom("beutiful weather today", 0.9, 0.5))

	if got.Words[0].Status != WordWeak {
		t.Fatalf("mispronounced word should be weak, got %s", got.Words[0].Status)
	}
	if got.Words[0].Score == 0 {
		t.Fatal("mispronounced word should keep partial credit")
	}
}

func TestScore_WrongWordIsMissing(t *testing.T) {
	e := NewWhisperEvaluator("http://unused")
	in := Input{TargetText: "beautiful weather today", DurationSeconds: 3, ExpectedDurationSeconds: 3}

	got := e.score(in, heardFrom("table weather today", 0.9, 0.5))

	if got.Words[0].Status != WordMissing {
		t.Fatalf("a completely different word should be missing, got %s", got.Words[0].Status)
	}
}

func TestScore_LowConfidenceIsWeak(t *testing.T) {
	e := NewWhisperEvaluator("http://unused")
	in := Input{TargetText: target, DurationSeconds: 4, ExpectedDurationSeconds: 4}

	// کلمه‌ها درست‌اند ولی مدل مطمئن نیست — یعنی مبهم ادا شده.
	got := e.score(in, heardFrom(target, 0.25, 0.5))

	for _, w := range got.Words {
		if w.Status != WordWeak {
			t.Fatalf("low-confidence word %q should be weak, got %s", w.Word, w.Status)
		}
	}
	clean := e.score(in, heardFrom(target, 0.95, 0.5))
	if got.PronunciationScore >= clean.PronunciationScore {
		t.Fatalf("mumbled read (%v) must score below clean read (%v)",
			got.PronunciationScore, clean.PronunciationScore)
	}
}

func TestScore_RamblingIsPenalized(t *testing.T) {
	e := NewWhisperEvaluator("http://unused")
	in := Input{TargetText: "hello there", DurationSeconds: 6, ExpectedDurationSeconds: 2}

	// همه‌ی کلمه‌های هدف هست، ولی کاربر کلی حرف اضافه هم زده.
	rambling := e.score(in, heardFrom("hello there um so what i mean is like you know", 0.9, 0.4))
	clean := e.score(Input{TargetText: "hello there", DurationSeconds: 2, ExpectedDurationSeconds: 2},
		heardFrom("hello there", 0.9, 0.4))

	if rambling.PronunciationScore >= clean.PronunciationScore {
		t.Fatalf("extra words must cost points: rambling=%v clean=%v",
			rambling.PronunciationScore, clean.PronunciationScore)
	}
}

func TestScore_LongPausesHurtFluency(t *testing.T) {
	smooth := []HeardWord{
		{Word: "hello", Start: 0, End: 0.5, Probability: 0.9},
		{Word: "there", Start: 0.5, End: 1.0, Probability: 0.9},
	}
	// همان دو کلمه، ولی با دو ثانیه مکث وسطش
	halting := []HeardWord{
		{Word: "hello", Start: 0, End: 0.5, Probability: 0.9},
		{Word: "there", Start: 2.5, End: 3.0, Probability: 0.9},
	}

	if fluencyFromTimings(halting, 1) >= fluencyFromTimings(smooth, 1) {
		t.Fatalf("a long mid-sentence pause must lower fluency: halting=%v smooth=%v",
			fluencyFromTimings(halting, 1), fluencyFromTimings(smooth, 1))
	}
}

func TestScore_PunctuationAndCaseIgnored(t *testing.T) {
	e := NewWhisperEvaluator("http://unused")
	in := Input{TargetText: "Hello, there!", DurationSeconds: 2, ExpectedDurationSeconds: 2}

	got := e.score(in, heardFrom("hello there", 0.95, 0.5))

	for _, w := range got.Words {
		if w.Status != WordOK {
			t.Fatalf("punctuation/case must not fail a word: %q -> %s", w.Word, w.Status)
		}
	}
}

func TestHybridEvaluator_MarksItselfEstimated(t *testing.T) {
	got := NewHybridEvaluator().Evaluate(t.Context(), Input{
		TargetText:              target,
		DurationSeconds:         4,
		ExpectedDurationSeconds: 4,
	})

	if !got.Estimated {
		t.Fatal("fallback scores must be flagged as estimates")
	}
	if len(got.Words) != 0 {
		t.Fatal("fallback must not invent per-word scores")
	}
}
