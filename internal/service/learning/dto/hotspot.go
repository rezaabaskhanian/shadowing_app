package dto

type Hotspot struct {
	ID        string     `json:"id"`
	Name      string     `json:"name" validate:"required"`
	XPosition float64    `json:"x_position" validate:"min=0,max=100"`
	YPosition float64    `json:"y_position" validate:"min=0,max=100"`
	Order     int        `json:"order"`
	Dialogues []Dialogue `json:"dialogues"` // ✅ اضافه شد

}
