package learningservice

import (
	"context"

	domain "shadowing-backend/internal/domain/learning/scene"
)

func (s Service) CreateCustomScene(ctx context.Context, sc domain.Scene) error {
	return s.repo.Create(ctx, sc)
}

func (s Service) GetSceneDomain(ctx context.Context, id string) (domain.Scene, error) {
	return s.repo.GetByID(ctx, id)
}

func (s Service) GetUserCustomScenes(ctx context.Context, userID string) ([]domain.Scene, error) {
	return s.repo.GetUserCustomScenes(ctx, userID)
}

func (s Service) DeleteUserCustomScene(ctx context.Context, userID, sceneID string) error {
	return s.repo.DeleteUserCustomScene(ctx, userID, sceneID)
}
