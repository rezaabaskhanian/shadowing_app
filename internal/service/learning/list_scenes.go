package learningservice

import (
	"context"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/learning/dto"
	"time"
)

func (s Service) ListScene(ctx context.Context) ([]dto.Scene, error) {
	const op = "learningservice.GetScene"

	scenes, err := s.repo.GetAll(ctx)
	if err != nil {
		return []dto.Scene{}, richerror.New(op).WithErr(err)
	}

	var dtoScene = make([]dto.Scene, len(scenes))

	for i, s := range scenes {

		var hotspotDTOs = make([]dto.Hotspot, len(s.Hotspots))

		for j, h := range s.Hotspots {

			var NewDialogue = make([]dto.Dialogue, len(h.Dialogues))

			for k, d := range h.Dialogues {
				NewDialogue[k] = dto.Dialogue{
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

			hotspotDTOs[j] = dto.Hotspot{
				ID:        string(h.ID),
				Name:      h.Name,
				XPosition: h.XPosition,

				YPosition: h.YPosition,
				Order:     h.OrderIndex,
				Dialogues: NewDialogue,
			}
			// newHospot = append(newHospot, newHospot...)
		}

		dtoScene[i] = dto.Scene{
			ID:                 string(s.ID),
			Title:              s.Title,
			Description:        s.Description,
			BackgroundImageURL: s.BackgroundImageURL,
			Difficulty:         string(s.Difficulty),
			Status:             string(s.Status),
			Hotspots:           hotspotDTOs,
			Order:              s.Order,

			CreatedAt: s.CreatedAt.Format(time.RFC3339),
			UpdatedAt: s.UpdatedAt.Format(time.RFC3339),
		}
	}

	return dtoScene, nil

}
