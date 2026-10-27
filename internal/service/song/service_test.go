package songservice

import "testing"

func TestPublishable(t *testing.T) {
	ok := Song{
		AudioURL: "/uploads/a.mp3", LicenseNote: "own song", DurationSeconds: 10,
		Lines: []Line{{Text: "a", StartMs: 0, EndMs: 2000}, {Text: "b", StartMs: 2000, EndMs: 4000}},
	}
	if msg := publishable(ok); msg != "" {
		t.Fatalf("expected publishable, got %q", msg)
	}
	cases := map[string]func(s *Song){
		"no audio":    func(s *Song) { s.AudioURL = "" },
		"no lines":    func(s *Song) { s.Lines = nil },
		"untimed":     func(s *Song) { s.Lines = []Line{{Text: "a"}} },
		"overlap":     func(s *Song) { s.Lines[1].StartMs = 1500 },
		"past length": func(s *Song) { s.Lines[1].EndMs = 20000 },
	}
	for name, mutate := range cases {
		s := ok
		s.Lines = append([]Line(nil), ok.Lines...)
		mutate(&s)
		if publishable(s) == "" {
			t.Errorf("%s: expected not publishable", name)
		}
	}
}
