package pathservice

import "testing"

func testPath() Path {
	return Path{Weeks: []Week{
		{ID: "w1", Position: 1, Sessions: []Session{
			{No: 1, Items: []Item{{Key: "a", Kind: KindScene, RefID: "s1", Required: true}, {Key: "p", Kind: KindPodcast, RefID: "p1"}}},
			{No: 2, Items: []Item{{Key: "b", Kind: KindScene, RefID: "s2", Required: true}}},
			{No: 3, Items: []Item{{Key: "cp", Kind: KindCheckpoint, Required: true}}},
		}},
		{ID: "w2", Position: 2, Sessions: []Session{
			{No: 1, Items: []Item{{Key: "c", Kind: KindScene, RefID: "s3", Required: true}}},
		}},
	}}
}

func TestApplyProgress_FreshUser(t *testing.T) {
	p := testPath()
	applyProgress(&p, nil, nil, nil)
	w1, w2 := p.Weeks[0], p.Weeks[1]
	if !w1.Unlocked || !w1.Sessions[0].Unlocked || w1.Sessions[1].Unlocked {
		t.Fatalf("only week 1 session 1 should be open: %+v", w1)
	}
	if w2.Unlocked {
		t.Fatal("week 2 must be locked before week 1's checkpoint")
	}
	if next := summarize(p).Next; next == nil || next.WeekPosition != 1 || next.SessionNo != 1 {
		t.Fatalf("next = %+v", next)
	}
}

func TestApplyProgress_SceneDoneElsewhereAndOptionalItem(t *testing.T) {
	p := testPath()
	// صحنه‌ی s1 جای دیگری از اپ تمام شده؛ پادکست اختیاری انجام نشده.
	applyProgress(&p, nil, map[string]bool{"s1": true}, nil)
	w1 := p.Weeks[0]
	if !w1.Sessions[0].Done || !w1.Sessions[1].Unlocked || w1.Sessions[2].Unlocked {
		t.Fatalf("session 1 done (optional podcast ignored), session 2 open: %+v", w1.Sessions)
	}
}

func TestApplyProgress_CheckpointAnyScoreUnlocksNextWeek(t *testing.T) {
	p := testPath()
	done := map[string]map[string]bool{"w1": {"b": true}}
	applyProgress(&p, done, map[string]bool{"s1": true}, map[string]int{"w1": 20})
	w1, w2 := p.Weeks[0], p.Weeks[1]
	if !w1.Done || !w1.CheckpointDone || w1.BestScore == nil || *w1.BestScore != 20 {
		t.Fatalf("week 1 should be done with best 20: %+v", w1)
	}
	if !w2.Unlocked || !w2.Sessions[0].Unlocked {
		t.Fatal("a low checkpoint score must still open week 2")
	}
	if w1.Checkpoint != nil {
		t.Fatal("checkpoint content must not be sent in the path view")
	}
}
