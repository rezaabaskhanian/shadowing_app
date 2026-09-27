package ttsservice

import (
	"context"
	"os/exec"
	"strings"
	"testing"
)

func TestPCMToWAV(t *testing.T) {
	pcm := make([]byte, 4800) // 0.1s سکوت با 24kHz
	wav := pcmToWAV(pcm, 24000)
	if !isWAV(wav) {
		t.Fatal("expected RIFF/WAVE header")
	}
	if len(wav) != 44+len(pcm) {
		t.Fatalf("unexpected wav size %d", len(wav))
	}
	if isWAV(pcm) {
		t.Fatal("raw pcm must not be detected as wav")
	}
}

func TestSampleRateFromMime(t *testing.T) {
	cases := map[string]int{
		"audio/L16;codec=pcm;rate=24000": 24000,
		"audio/L16; rate=16000":          16000,
		"audio/wav":                      24000,
		"":                               24000,
	}
	for mime, want := range cases {
		if got := sampleRateFromMime(mime, 24000); got != want {
			t.Errorf("%q: got %d want %d", mime, got, want)
		}
	}
}

func TestBuildTTSPart(t *testing.T) {
	const line = "No problem, that's what we're here for."

	// 3.8: متن باید دقیقاً خودِ دیالوگ باشد و دستور سرعت جدا بیاید.
	part := buildTTSPart("gemini-3.8-flash-tts", line, 0, true)
	if part["text"] != line {
		t.Errorf("3.8 default speed: text must be verbatim, got %q", part["text"])
	}
	if _, ok := part["speechMetadata"]; ok {
		t.Error("3.8 default speed: no speechMetadata expected")
	}

	part = buildTTSPart("gemini-3.8-flash-lite-tts", line, 0.7, true)
	if part["text"] != line {
		t.Errorf("3.8 slow: text must be verbatim, got %q", part["text"])
	}
	meta, ok := part["speechMetadata"].(map[string]string)
	if !ok || !strings.Contains(meta["style"], "slow") {
		t.Errorf("3.8 slow: expected slow style, got %v", part["speechMetadata"])
	}

	part = buildTTSPart("gemini-3.8-flash-tts", line, 0.7, false)
	if _, ok := part["speechMetadata"]; ok {
		t.Error("withStyle=false must drop speechMetadata")
	}

	// مدل‌های قدیمی‌تر: دستور جلوی متن.
	part = buildTTSPart("gemini-2.5-flash-preview-tts", line, 1.2, true)
	if txt, _ := part["text"].(string); !strings.Contains(txt, "faster") || !strings.HasSuffix(txt, line) {
		t.Errorf("legacy fast: got %q", txt)
	}
	if part = buildTTSPart("gemini-2.5-flash-preview-tts", line, 0, true); part["text"] != line {
		t.Errorf("legacy default speed: text must be verbatim, got %q", part["text"])
	}
}

func TestWAVToMP3(t *testing.T) {
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("ffmpeg not installed")
	}
	mp3, err := wavToMP3(context.Background(), pcmToWAV(make([]byte, 48000), 24000))
	if err != nil {
		t.Fatal(err)
	}
	if len(mp3) == 0 {
		t.Fatal("empty mp3")
	}
}
