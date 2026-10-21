package ttsservice

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestSplitForGroq(t *testing.T) {
	short := "Hello, how are you?"
	if got := splitForGroq(short, groqMaxChars); len(got) != 1 || got[0] != short {
		t.Fatalf("short text must stay whole: %v", got)
	}

	long := strings.Repeat("This is a fairly ordinary English sentence. ", 12)
	chunks := splitForGroq(long, groqMaxChars)
	if len(chunks) < 2 {
		t.Fatalf("expected several chunks, got %d", len(chunks))
	}
	for _, c := range chunks {
		if utf8.RuneCountInString(c) > groqMaxChars {
			t.Fatalf("chunk too long (%d): %q", utf8.RuneCountInString(c), c)
		}
		if !strings.HasSuffix(c, ".") {
			t.Fatalf("chunks should break on sentence ends: %q", c)
		}
	}
	if strings.Join(chunks, " ") != strings.TrimSpace(long) {
		t.Fatal("chunks must reproduce the text")
	}

	noPunct := strings.Repeat("word ", 80)
	for _, c := range splitForGroq(noPunct, groqMaxChars) {
		if utf8.RuneCountInString(c) > groqMaxChars {
			t.Fatalf("unpunctuated chunk too long: %d", utf8.RuneCountInString(c))
		}
	}
}

func TestGroqVoiceFor(t *testing.T) {
	cases := map[string]string{
		"diana": "diana", "TROY": "troy",
		"Kore": "hannah", "Puck": "austin", // صداهای Gemini بر اساس جنسیت
		"": "autumn", "nobody": "autumn",
	}
	for in, want := range cases {
		if got := groqVoiceFor(in); got != want {
			t.Errorf("groqVoiceFor(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestJoinWAVs(t *testing.T) {
	a := pcmToWAV(make([]byte, 4800), 24000)
	b := pcmToWAV(make([]byte, 2400), 24000)
	joined, err := joinWAVs([][]byte{a, b})
	if err != nil {
		t.Fatal(err)
	}
	pcm, rate, err := wavPCM(joined)
	if err != nil || rate != 24000 {
		t.Fatalf("rate=%d err=%v", rate, err)
	}
	gap := 24000 * 2 * groqChunkGapMs / 1000
	if len(pcm) != 4800+gap+2400 {
		t.Fatalf("pcm len = %d, want %d", len(pcm), 4800+gap+2400)
	}
}
