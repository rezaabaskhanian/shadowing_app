package learningservice

import (
	"testing"

	scene "shadowing-backend/internal/domain/learning/scene"
)

func TestOrderForLevelPosition(t *testing.T) {
	pub := scene.StatusPublished
	all := []scene.Scene{
		{ID: "b1", Order: 1, Difficulty: scene.DifficultyBeginner, Status: pub},
		{ID: "i1", Order: 2, Difficulty: scene.DifficultyIntermediate, Status: pub},
		{ID: "b2", Order: 3, Difficulty: scene.DifficultyBeginner, Status: pub},
		{ID: "d1", Order: 4, Difficulty: scene.DifficultyBeginner, Status: scene.StatusDraft},
		{ID: "b3", Order: 5, Difficulty: scene.DifficultyBeginner, Status: pub},
		{ID: "i2", Order: 6, Difficulty: scene.DifficultyIntermediate, Status: pub},
	}
	cases := []struct {
		name     string
		diff     scene.DifficultyLevel
		position int
		exclude  scene.SceneID
		want     int
	}{
		{"insert before 2nd beginner", scene.DifficultyBeginner, 2, "", 3},
		{"drafts are not counted", scene.DifficultyBeginner, 3, "", 5},
		{"past the end goes after last of level", scene.DifficultyBeginner, 16, "", 6},
		{"moving a scene excludes itself", scene.DifficultyBeginner, 2, "b2", 5},
		{"empty level goes to end of path", scene.DifficultyAdvanced, 1, "", 7},
	}
	for _, c := range cases {
		if got := orderForLevelPosition(all, c.diff, c.position, c.exclude); got != c.want {
			t.Errorf("%s: got %d, want %d", c.name, got, c.want)
		}
	}
	if got := levelPositionOf(all, all[4]); got != 3 {
		t.Errorf("levelPositionOf(b3): got %d, want 3", got)
	}
}
