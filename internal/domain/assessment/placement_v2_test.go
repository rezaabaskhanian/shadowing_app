package assessment

import (
	"math"
	"testing"
)

func vocabAnswers(knownPerBand [5]int, shownPerBand int, pseudoYes, pseudoTotal int) []VocabAnswer {
	var out []VocabAnswer
	for b := 1; b <= 5; b++ {
		for i := 0; i < shownPerBand; i++ {
			out = append(out, VocabAnswer{Band: b, Known: i < knownPerBand[b-1]})
		}
	}
	for i := 0; i < pseudoTotal; i++ {
		out = append(out, VocabAnswer{IsPseudo: true, Known: i < pseudoYes})
	}
	return out
}

func TestEstimateVocab(t *testing.T) {
	tests := []struct {
		name      string
		known     [5]int
		pseudoYes int
		wantSize  int
		wantLevel Level
		wantValid bool
	}{
		{"beginner knows only band 1", [5]int{12, 2, 0, 0, 0}, 0, 1150, LevelA1, true},
		{"B1 learner", [5]int{12, 11, 9, 0, 0}, 0, 2650, LevelB1, true},
		{"C1 learner", [5]int{12, 12, 11, 10, 6}, 1, 4000, LevelC1, true},
		{"says yes to everything", [5]int{12, 12, 12, 12, 12}, 20, 0, LevelA1, false},
		{"guesser is penalised", [5]int{12, 12, 6, 0, 0}, 5, 1750, LevelA2, true},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := EstimateVocab(vocabAnswers(tc.known, 12, tc.pseudoYes, 20))
			if got.Size != tc.wantSize || got.Level != tc.wantLevel || got.Valid != tc.wantValid {
				t.Fatalf("got %+v, want size=%d level=%s valid=%v", got, tc.wantSize, tc.wantLevel, tc.wantValid)
			}
		})
	}
}

func TestEstimateVocabAdaptiveSkipsUnshownBands(t *testing.T) {
	var answers []VocabAnswer
	for b := 1; b <= 3; b++ {
		for i := 0; i < 12; i++ {
			answers = append(answers, VocabAnswer{Band: b, Known: b < 3 || i < 4})
		}
	}
	got := EstimateVocab(answers)
	if got.Size != 2350 || got.Level != LevelA2 {
		t.Fatalf("got %+v", got)
	}
}

func TestHighestPassedLevel(t *testing.T) {
	ans := []LevelAnswer{
		{LevelA2, true}, {LevelA2, true}, {LevelA2, false},
		{LevelB1, true}, {LevelB1, true}, {LevelB1, true},
		{LevelB2, true}, {LevelB2, false}, {LevelB2, false},
	}
	if got := HighestPassedLevel(ans); got != LevelB1 {
		t.Fatalf("got %s, want B1", got)
	}
	if got := HighestPassedLevel([]LevelAnswer{{LevelA2, false}, {LevelA1, false}}); got != LevelA1 {
		t.Fatalf("all failed: got %s, want A1", got)
	}
	if got := HighestPassedLevel([]LevelAnswer{{LevelC1, true}}); got != LevelC1 {
		t.Fatalf("single item: got %s, want C1", got)
	}
}

func TestWordAccuracy(t *testing.T) {
	tests := []struct {
		target, said string
		want         float64
	}{
		{"I like to drink tea in the morning.", "I like to drink tea in the morning", 1},
		{"I like to drink tea in the morning.", "I like drink tea morning", 5.0 / 8.0},
		{"If it rains tomorrow, we'll have the picnic at home.", "if it rains tomorrow we will have the picnic at home", 1},
		{"Had I known about the delay, I would have taken an earlier train.", "If I knew about the delay I took an earlier train", 8.0 / 13.0},
		{"Hello there", "", 0},
	}
	for _, tc := range tests {
		if got := WordAccuracy(tc.target, tc.said); math.Abs(got-tc.want) > 1e-9 {
			t.Errorf("WordAccuracy(%q, %q) = %v, want %v", tc.target, tc.said, got, tc.want)
		}
	}
}

func TestDecidePlacement(t *testing.T) {
	valid := func(l Level) VocabResult { return VocabResult{Level: l, Valid: true} }
	tests := []struct {
		name      string
		vocab     VocabResult
		listen    Level
		speak     Level
		wantComp  Level
		wantStart Level
	}{
		{"balanced", valid(LevelB1), LevelB1, LevelB1, LevelB1, LevelB1},
		{"vocab caps listening", valid(LevelA2), LevelB2, LevelB1, LevelA2, LevelA2},
		{"speaking one below keeps comprehension", valid(LevelB2), LevelB2, LevelB1, LevelB2, LevelB2},
		{"speaking two below drops one", valid(LevelB2), LevelB2, LevelA2, LevelB2, LevelB1},
		{"invalid vocab ignored", VocabResult{Level: LevelA1, Valid: false}, LevelB1, LevelB1, LevelB1, LevelB1},
		{"A1 floor", valid(LevelA1), LevelA1, LevelA1, LevelA1, LevelA1},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := DecidePlacement(tc.vocab, tc.listen, tc.speak)
			if got.Comprehension != tc.wantComp || got.Start != tc.wantStart {
				t.Fatalf("got %+v, want comp=%s start=%s", got, tc.wantComp, tc.wantStart)
			}
		})
	}
}

func TestHighestAnyPassedLevel(t *testing.T) {
	ans := []LevelAnswer{{LevelA1, true}, {LevelA2, true}, {LevelB1, false}, {LevelB2, false}}
	if got := HighestAnyPassedLevel(ans); got != LevelA2 {
		t.Fatalf("got %s, want A2", got)
	}
	if got := HighestAnyPassedLevel([]LevelAnswer{{LevelC1, false}, {LevelC1, true}}); got != LevelC1 {
		t.Fatalf("one of two C1: got %s, want C1", got)
	}
}
