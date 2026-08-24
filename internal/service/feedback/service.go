package feedbackservice

import (
	"context"

	postgresfeedback "shadowing-backend/internal/repository/postgres/feedback"
)

type repository interface {
	Create(ctx context.Context, userID, message string) (postgresfeedback.Feedback, error)
	ListAll(ctx context.Context) ([]postgresfeedback.Feedback, error)
}

type Service struct {
	repo repository
}

func New(repo repository) Service {
	return Service{repo: repo}
}

type Feedback = postgresfeedback.Feedback

func (s Service) Create(ctx context.Context, userID, message string) (Feedback, error) {
	return s.repo.Create(ctx, userID, message)
}

func (s Service) ListAll(ctx context.Context) ([]Feedback, error) {
	return s.repo.ListAll(ctx)
}
