package specialtyservice

import "testing"

func TestNormalizeField(t *testing.T) {
	f := Field{Key: " Medicine ", TitleFa: " پزشکی ", MinLevel: "?"}
	if msg := NormalizeField(&f); msg != "" {
		t.Fatal(msg)
	}
	if f.Key != "medicine" || f.TitleFa != "پزشکی" || f.MinLevel != "intermediate" {
		t.Fatalf("normalized = %+v", f)
	}
	for _, bad := range []Field{{Key: "it-dept", TitleFa: "x"}, {Key: "1it", TitleFa: "x"}, {Key: "it", TitleFa: " "}} {
		if NormalizeField(&bad) == "" {
			t.Errorf("expected error for %+v", bad)
		}
	}
}

func TestNormalizeWordsDropsEmptyAndDuplicates(t *testing.T) {
	out := NormalizeWords([]Word{{Word: "Diagnosis"}, {Word: " diagnosis "}, {Word: ""}, {Word: "ward", Level: "advanced"}})
	if len(out) != 2 || out[0].Level != "intermediate" || out[1].Level != "advanced" {
		t.Fatalf("words = %+v", out)
	}
}
