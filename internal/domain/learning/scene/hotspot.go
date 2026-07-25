package scence

import "time"

type Hotspot struct {
	ID         HotspotID
	SceneID    SceneID // ✅ اضافه شد - کلید خارجی به Scene
	Name       string
	XPosition  float64
	YPosition  float64
	OrderIndex int
	Dialogues  []Dialogue
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func NewHotspot(name string, x, y float64, order int) Hotspot {

	uid := NewHotspotID()
	return Hotspot{
		ID:         uid,
		Name:       name,
		XPosition:  x,
		YPosition:  y,
		OrderIndex: order,
		Dialogues:  []Dialogue{},
	}
}

func (h *Hotspot) AddDialogue(d Dialogue) {
	h.Dialogues = append(h.Dialogues, d)
}
