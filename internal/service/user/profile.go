package userservice

import (
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/user/dto"
)

func (s Service) Profile(userID string) (dto.ProfileResponse, error) {

	const op = "userservice.profile"

	res, err := s.repo.GetUserByID(userID)

	if err != nil {
		return dto.ProfileResponse{}, richerror.New(op).WithErr(err).WithMessage("dont get from GETUSERBYID")
	}

	return dto.ProfileResponse{
		UserInfo: dto.UserInfo{
			ID:       string(res.ID),
			Nickname: res.NickName,
			Password: "",
			Phone:    res.Phone,
			Role:     res.Role,
		},
	}, err

}
