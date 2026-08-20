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

	GetSettings(ctx context.Context) (postgreslanding.Settings, error)
	UpdateSettings(ctx context.Context, s postgreslanding.Settings) error

	ListHighlights(ctx context.Context, kind string) ([]postgreslanding.Highlight, error)
	CreateHighlight(ctx context.Context, kind, icon, title, description string, position int) (postgreslanding.Highlight, error)
	UpdateHighlight(ctx context.Context, id uuid.UUID, icon, title, description string, position int) error
	DeleteHighlight(ctx context.Context, id uuid.UUID) error

	ListFAQs(ctx context.Context) ([]postgreslanding.FAQ, error)
	CreateFAQ(ctx context.Context, question, answer string, position int) (postgreslanding.FAQ, error)
	UpdateFAQ(ctx context.Context, id uuid.UUID, question, answer string, position int) error
	DeleteFAQ(ctx context.Context, id uuid.UUID) error
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

func (s Service) GetSettings(ctx context.Context) (postgreslanding.Settings, error) {
	return s.repo.GetSettings(ctx)
}

func (s Service) UpdateSettings(ctx context.Context, settings postgreslanding.Settings) error {
	return s.repo.UpdateSettings(ctx, settings)
}

func (s Service) ListHighlights(ctx context.Context, kind string) ([]postgreslanding.Highlight, error) {
	return s.repo.ListHighlights(ctx, kind)
}

func (s Service) CreateHighlight(ctx context.Context, kind, icon, title, description string, position int) (postgreslanding.Highlight, error) {
	return s.repo.CreateHighlight(ctx, kind, icon, title, description, position)
}

func (s Service) UpdateHighlight(ctx context.Context, id uuid.UUID, icon, title, description string, position int) error {
	return s.repo.UpdateHighlight(ctx, id, icon, title, description, position)
}

func (s Service) DeleteHighlight(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteHighlight(ctx, id)
}

func (s Service) ListFAQs(ctx context.Context) ([]postgreslanding.FAQ, error) {
	return s.repo.ListFAQs(ctx)
}

func (s Service) CreateFAQ(ctx context.Context, question, answer string, position int) (postgreslanding.FAQ, error) {
	return s.repo.CreateFAQ(ctx, question, answer, position)
}

func (s Service) UpdateFAQ(ctx context.Context, id uuid.UUID, question, answer string, position int) error {
	return s.repo.UpdateFAQ(ctx, id, question, answer, position)
}

func (s Service) DeleteFAQ(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteFAQ(ctx, id)
}
