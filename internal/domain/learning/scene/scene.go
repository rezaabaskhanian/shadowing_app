package scence

import (
	"errors"
	"time"
)

type Scene struct {
	ID                 SceneID
	Title              string
	Description        string
	BackgroundImageURL string
	Difficulty         DifficultyLevel
	Status             SceneStatus
	Hotspots           []Hotspot
	Order              int
	IsLocked           bool
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

func NewScene(title, description, bgImage string, difficulty DifficultyLevel, isLocked bool) (Scene, error) {
	if title == "" {
		return Scene{}, errors.New("title is required")
	}
	if bgImage == "" {
		return Scene{}, errors.New("background image is required")
	}

	now := time.Now()

	seneID := NewSenceID()

	return Scene{
		ID:                 seneID,
		Title:              title,
		Description:        description,
		BackgroundImageURL: bgImage,
		Difficulty:         difficulty,
		Status:             StatusDraft,
		Hotspots:           []Hotspot{},
		IsLocked:           isLocked,
		CreatedAt:          now,
		UpdatedAt:          now,
	}, nil
}

func (s *Scene) Publish() error {
	if len(s.Hotspots) == 0 {
		return errors.New("cannot publish scene without hotspots")
	}
	s.Status = StatusPublished
	s.UpdatedAt = time.Now()
	return nil
}

func (s *Scene) AddHotspot(hotspot Hotspot) {
	s.Hotspots = append(s.Hotspots, hotspot)
	s.UpdatedAt = time.Now()
}
