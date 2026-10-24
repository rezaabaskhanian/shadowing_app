package interviewservice

import (
	"testing"

	postgresinterview "shadowing-backend/internal/repository/postgres/interview"
)

func TestBuildReportUsesBestTryPerQuestion(t *testing.T) {
	set := Set{ID: "s", Questions: []Question{{ID: "q1"}, {ID: "q2"}, {ID: "q3"}}}
	answers := []postgresinterview.AnswerRow{
		{QuestionID: "q1", TryNo: 1, Score: 40, Transcript: "one two three", DurationSeconds: 6},
		{QuestionID: "q1", TryNo: 2, Score: 70, Transcript: "one two three four five six", DurationSeconds: 6},
		{QuestionID: "q2", TryNo: 1, Score: 80, Transcript: "a b", DurationSeconds: 0},
	}
	rep := BuildReport(set, answers)
	if rep.Total != 3 || rep.Answered != 2 {
		t.Fatalf("total/answered = %d/%d", rep.Total, rep.Answered)
	}
	if rep.Score != 75 {
		t.Fatalf("score = %d, want 75 (best of q1 = 70, q2 = 80)", rep.Score)
	}
	if rep.Improved != 1 {
		t.Fatalf("improved = %d, want 1", rep.Improved)
	}
	q1 := rep.Questions[0]
	if q1.Tries != 2 || q1.BestScore != 70 || q1.FirstScore != 40 || q1.WordsPerMinute != 60 {
		t.Fatalf("q1 report = %+v", q1)
	}
	if rep.Questions[1].WordsPerMinute != 0 {
		t.Fatal("zero duration must not divide by zero")
	}
}

func TestNormalizeSet(t *testing.T) {
	set := Set{Title: " Nurse interview ", Kind: "job", Level: "x", Questions: []Question{
		{Text: "  Tell me about yourself. ", KeyPhrases: []string{" I have ", ""}},
		{Text: "   "},
	}}
	if err := NormalizeSet(&set); err != nil {
		t.Fatal(err)
	}
	if set.Title != "Nurse interview" || set.Level != "intermediate" || len(set.Questions) != 1 {
		t.Fatalf("normalized = %+v", set)
	}
	q := set.Questions[0]
	if q.PrepSeconds != 10 || q.AnswerSeconds != 60 || len(q.KeyPhrases) != 1 || q.KeyPhrases[0] != "I have" {
		t.Fatalf("question = %+v", q)
	}

	for name, bad := range map[string]Set{
		"no title":        {Kind: "job"},
		"bad kind":        {Title: "t", Kind: "chat"},
		"active empty":    {Title: "t", Kind: "visa", IsActive: true},
		"answer too long": {Title: "t", Kind: "admission", Questions: []Question{{Text: "q", AnswerSeconds: 600}}},
	} {
		if err := NormalizeSet(&bad); err == nil {
			t.Errorf("%s: expected error", name)
		}
	}
}

func TestIsOn(t *testing.T) {
	for v, want := range map[string]bool{"true": true, " ON ": true, "1": true, "": false, "false": false, "0": false} {
		if isOn(v) != want {
			t.Errorf("isOn(%q) != %v", v, want)
		}
	}
}
