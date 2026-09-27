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

func TestBuildPromptPace(t *testing.T) {
	if p := buildPrompt("Hi", 0); !strings.HasSuffix(p, "naturally:\nHi") {
		t.Errorf("default speed prompt: %q", p)
	}
	if p := buildPrompt("Hi", 0.7); !strings.Contains(p, "slow") {
		t.Errorf("slow speed prompt: %q", p)
	}
	if p := buildPrompt("Hi", 1.2); !strings.Contains(p, "faster") {
		t.Errorf("fast speed prompt: %q", p)
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
