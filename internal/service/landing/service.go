package landingservice

import (
	"context"

	postgreslanding "shadowing-backend/internal/repository/postgres/landing"

	"github.com/google/uuid"
)

type Repository interface {
	ListWithImages(ctx context.Context) ([]postgreslanding.Section, error)
	Create(ctx context.Context, tabLabel, title, description string, position int) (postgreslanding.Section, error)
	Update(ctx context.Context, id uuid.UUID, tabLabel, title, description string, position int) error
	Delete(ctx context.Context, id uuid.UUID) error
	AddImage(ctx context.Context, sectionID uuid.UUID, url string, position int) (postgreslanding.Image, error)
	DeleteImage(ctx context.Context, imageID uuid.UUID) error
}

type Service struct {
	repo Repository
}

func New(repo Repository) Service {
	return Service{repo: repo}
}

func (s Service) List(ctx context.Context) ([]postgreslanding.Section, error) {
	return s.repo.ListWithImages(ctx)
}

func (s Service) Create(ctx context.Context, tabLabel, title, description string, position int) (postgreslanding.Section, error) {
	return s.repo.Create(ctx, tabLabel, title, description, position)
}

func (s Service) Update(ctx context.Context, id uuid.UUID, tabLabel, title, description string, position int) error {
	return s.repo.Update(ctx, id, tabLabel, title, description, position)
}

func (s Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s Service) AddImage(ctx context.Context, sectionID uuid.UUID, url string, position int) (postgreslanding.Image, error) {
	return s.repo.AddImage(ctx, sectionID, url, position)
}

func (s Service) DeleteImage(ctx context.Context, imageID uuid.UUID) error {
	return s.repo.DeleteImage(ctx, imageID)
}
