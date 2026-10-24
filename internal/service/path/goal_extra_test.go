package pathservice

import "testing"

func TestPickTodayExtraRotatesKindAndSkipsDone(t *testing.T) {
	extras := []GoalExtraView{
		{Kind: "podcast", ID: "p1"},
		{Kind: "topic", ID: "t1", Done: true},
		{Kind: "topic", ID: "t2"},
		{Kind: "writing", ID: "w1"},
	}
	cases := map[int]string{0: "p1", 1: "t2", 2: "w1", 3: "p1"}
	for day, want := range cases {
		if got := pickTodayExtra(extras, day); got == nil || got.ID != want {
			t.Fatalf("day %d: want %s, got %+v", day, want, got)
		}
	}
	// نوع امروز تمام شده باشد → اولین انجام‌نشده از هر نوع.
	onlyPodcastLeft := []GoalExtraView{{Kind: "writing", ID: "w1", Done: true}, {Kind: "podcast", ID: "p1"}}
	if got := pickTodayExtra(onlyPodcastLeft, 2); got == nil || got.ID != "p1" {
		t.Fatalf("fallback: got %+v", got)
	}
	if got := pickTodayExtra([]GoalExtraView{{Kind: "topic", ID: "t1", Done: true}}, 1); got != nil {
		t.Fatalf("all done: want nil, got %+v", got)
	}
}
