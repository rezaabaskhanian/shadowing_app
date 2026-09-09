package learningservice

import (
	"context"
	"shadowing-backend/internal/pkg/richerror"
)

// UpdateSceneOrder فقط ترتیب یک صحنه در مسیر آموزشی را تغییر می‌دهد.
func (s Service) UpdateSceneOrder(ctx context.Context, id string, order int) error {
	const op = "learningservice.UpdateSceneOrder"

	if err := s.repo.UpdateOrder(ctx, id, order); err != nil {
		return richerror.New(op).WithErr(err)
	}

	return nil
}
