package learningservice

import (
	"context"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/learning/dto"
	"time"
)

func (s Service) GetScene(ctx context.Context, ID string) (dto.Scene, error) {
	const op = "learningservice.GetScene"

	scene, err := s.repo.GetByID(ctx, ID)
	if err != nil {
		return dto.Scene{}, richerror.New(op).WithErr(err)
	}

	var hotspotDTOs = make([]dto.Hotspot, len(scene.Hotspots))

	for i, h := range scene.Hotspots {

		var NewDialogue = make([]dto.Dialogue, len(h.Dialogues))

		for j, d := range h.Dialogues {
			NewDialogue[j] = dto.Dialogue{
				ID:           string(d.ID),
				Order:        d.Order,
				Speaker:      string(d.Speaker),
				OriginalText: d.OriginalText,
				Translation:  d.Translation,
				AudioURL:     d.AudioURL,
				DisplayType:  string(d.DisplayType),
				PartialHint:  d.PartialHint,
				WaitDuration: d.WaitDuration,
			}
			// NewDialogue = append(NewDialogue, NewDialogue...)
		}

		hotspotDTOs[i] = dto.Hotspot{
			ID:        string(h.ID),
			Name:      h.Name,
			XPosition: h.XPosition,

			YPosition: h.YPosition,
			Order:     h.OrderIndex,
			Dialogues: NewDialogue,
		}
		// newHospot = append(newHospot, newHospot...)
	}

	return dto.Scene{
		ID: string(scene.ID),

		Title:              scene.Title,
		Description:        scene.Description,
		BackgroundImageURL: scene.BackgroundImageURL,

		Difficulty: string(scene.Difficulty),
		Status:     string(scene.Status),
		Hotspots:   hotspotDTOs,
		Order:      scene.Order,

		CreatedAt: scene.CreatedAt.Format(time.RFC3339),

		UpdatedAt: scene.UpdatedAt.Format(time.RFC3339),
	}, nil

}
