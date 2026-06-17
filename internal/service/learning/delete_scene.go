package learningservice

import (
	"context"
	"shadowing-backend/internal/pkg/richerror"
)

func (s Service) DeleteScene(ctx context.Context, ID string) error {
	const op = "learningservice.DeleteScene"

	err := s.repo.Delete(ctx, ID)

	if err != nil {
		return richerror.New(op).WithErr(err)
	}

	return nil

}
