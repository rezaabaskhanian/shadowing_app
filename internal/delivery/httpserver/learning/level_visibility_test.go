package learninghandler

import (
	"testing"

	scene "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/service/learning/dto"
)

func TestFilterByLevel(t *testing.T) {
	scenes := []dto.Scene{
		{ID: "b1", Difficulty: "beginner"}, {ID: "b2", Difficulty: "beginner"}, {ID: "b3", Difficulty: "beginner"},
		{ID: "i1", Difficulty: "intermediate"}, {ID: "i2", Difficulty: "intermediate"}, {ID: "i3", Difficulty: "intermediate"},
		{ID: "a1", Difficulty: "advanced"}, {ID: "a2", Difficulty: "advanced"}, {ID: "a3", Difficulty: "advanced"},
	}
	cases := map[scene.DifficultyLevel]string{
		scene.DifficultyBeginner:     "b1,b2,b3,i1,i2,a1,a2",
		scene.DifficultyIntermediate: "b1,b2,b3,i1,i2,i3,a1,a2",
		scene.DifficultyAdvanced:     "b1,b2,b3,i1,i2,i3,a1,a2,a3",
	}
	for level, want := range cases {
		got := ""
		for i, s := range filterByLevel(scenes, level) {
			if i > 0 {
				got += ","
			}
			got += s.ID
		}
		if got != want {
			t.Errorf("%s: got %s, want %s", level, got, want)
		}
	}
}
