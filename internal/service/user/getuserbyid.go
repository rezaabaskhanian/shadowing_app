package userservice

import (
	domain "shadowing-backend/internal/domain/user"
	"shadowing-backend/internal/pkg/richerror"
)

func (s Service) GetUserByIDService(id string) (domain.User, error) {

	const op = "userservice.GetUserByID"

	user, err := s.repo.GetUserByID(id)

	if err != nil {
		return domain.User{}, richerror.New(op).WithErr(err).WithMessage("چنین یوزری موجود تنیست")
	}

	return domain.User{
			ID:       user.ID, // UserID -> string
			NickName: user.NickName,
			Phone:    user.Phone,
			Role:     user.Role,
		},
		nil

}
