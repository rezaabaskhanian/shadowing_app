package dto

type Scene struct {
	ID                 string    `json:"id"` // SceneID as string
	Title              string    `json:"title"`
	Description        string    `json:"description"`
	BackgroundImageURL string    `json:"backgroundImageURL"`
	Difficulty         string    `json:"difficulty"`
	Status             string    `json:"status"`
	Hotspots           []Hotspot `json:"hotspots"`
	Order              int       `json:"order"`

	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}
