package pathservice

import (
	"context"
	"testing"

	postgrespath "shadowing-backend/internal/repository/postgres/path"
)

func TestAdminSaveGoalMapRejectsBadInput(t *testing.T) {
	s := &Service{} // همه‌ی این حالت‌ها باید پیش از رسیدن به دیتابیس رد شوند
	ok := GoalMap{Goal: "travel", ImageURL: "/uploads/map.jpg", Width: 1376, Height: 768}
	cases := map[string]func(m *GoalMap){
		"bad goal":      func(m *GoalMap) { m.Goal = "holiday" },
		"no image":      func(m *GoalMap) { m.ImageURL = " " },
		"no size":       func(m *GoalMap) { m.Width = 0 },
		"zero position": func(m *GoalMap) { m.Spots = []postgrespath.GoalMapSpot{{Position: 0, X: 10, Y: 10}} },
		"dup position": func(m *GoalMap) {
			m.Spots = []postgrespath.GoalMapSpot{{Position: 1, X: 1, Y: 1}, {Position: 1, X: 2, Y: 2}}
		},
		"x out of range": func(m *GoalMap) { m.Spots = []postgrespath.GoalMapSpot{{Position: 1, X: 120, Y: 10}} },
		"y negative":     func(m *GoalMap) { m.Spots = []postgrespath.GoalMapSpot{{Position: 1, X: 10, Y: -1}} },
		"tiles count": func(m *GoalMap) {
			m.Tiles = &postgrespath.GoalMapTiles{TileSize: 1024, FullWidth: 5504, FullHeight: 3072, Cols: 6, Rows: 3, URLs: []string{"/a.jpg"}}
		},
	}
	for name, mutate := range cases {
		m := ok
		mutate(&m)
		if err := s.AdminSaveGoalMap(context.Background(), m); err == nil {
			t.Errorf("%s: want error, got nil", name)
		}
	}
}
