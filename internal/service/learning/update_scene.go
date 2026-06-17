package learningservice

import (
	"context"
	domain "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/learning/dto"
)

func (s Service) UpdateScene(ctx context.Context, req dto.Scene) error {
	const op = "learningservice.UpdateScene"

	scene, err := s.repo.GetByID(ctx, req.ID)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}

	sceneResult := domain.Scene{
		ID:                 scene.ID,
		Title:              scene.Title,
		Description:        scene.Description,
		BackgroundImageURL: scene.BackgroundImageURL,
		Difficulty:         scene.Difficulty,
		Status:             scene.Status,
		Hotspots:           scene.Hotspots,
		Order:              scene.Order,
		CreatedAt:          scene.CreatedAt,
		UpdatedAt:          scene.UpdatedAt,
	}

	err = s.repo.Update(ctx, sceneResult)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}

	return nil

}

//TODO : برای زمانیاست که ما میخاهیم بیاییم .برگردونیمscene.  اونجابایددوباره بگیرم با آیدی
