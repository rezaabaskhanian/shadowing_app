package userservice

import (
	"errors"
	"fmt"
	domain "shadowing-backend/internal/domain/user"
	"shadowing-backend/internal/pkg/errmesg"
	"shadowing-backend/internal/service/user/dto"
	"strings"

	"github.com/jackc/pgx/v5"
)

func (s Service) Register(req dto.RegisterRequest) (dto.RegisterResponse, error) {

	const op = "user.Register"

	// ========== 1️⃣ Validation در لایه Application ==========

	_, err := s.repo.GetUserByPhoneNumber(req.Phone)

	if err == nil {
		// کاربر وجود دارد - خطای تکراری
		return dto.RegisterResponse{}, errors.New(errmesg.ErrorMsgPhoneNumberIsNotUniqe)
	}

	if err != pgx.ErrNoRows {
		// یک خطای واقعی دیتابیس (غیر از "یافت نشد")
		return dto.RegisterResponse{}, fmt.Errorf("database error: %w", err)
	}
	user, err := domain.NewUser(
		req.Nickname, req.Password, req.Phone, req.Role,
	)

	if err != nil {
		return dto.RegisterResponse{}, fmt.Errorf("%s: %w", op, err)
	}

	// 2️⃣ ذخیره در Repository
	//پوینتر برمیگردانیم چون نمیخاهیم کپی شود و خافظه زیادی مصرف کند

	createdUser, err := s.repo.CreateUser(user)
	if err != nil {

		if strings.Contains(err.Error(), "duplicate") {
			return dto.RegisterResponse{}, fmt.Errorf("user already exists")
		}
		return dto.RegisterResponse{}, fmt.Errorf("database error")
	}

	// 3️⃣ ایجاد توکن‌ها با User Aggregate
	accessToken, err := s.auth.CreateAccessToken(createdUser)
	if err != nil {
		return dto.RegisterResponse{}, fmt.Errorf("token generation failed")
	}

	refreshToken, err := s.auth.CreateRefreshToken(createdUser)
	if err != nil {
		return dto.RegisterResponse{}, fmt.Errorf("token generation failed")
	}

	// 4️⃣ ساخت DTO خروجی
	return dto.RegisterResponse{
		UserInfo: dto.UserInfo{
			ID:       string(createdUser.ID), // UserID -> string
			Nickname: createdUser.NickName,
			Phone:    createdUser.Phone,
			Role:     createdUser.Role,
		},
		Tokens: dto.Tokens{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
	}, nil

}
