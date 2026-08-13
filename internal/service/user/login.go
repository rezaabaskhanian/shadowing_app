// internal/service/user/service.go
package userservice

import (
	"errors"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/user/dto"

	"github.com/jackc/pgx/v5"
)

func (s Service) Login(req dto.LoginRequest) (dto.LoginResponse, error) {
	const op = "userservice.Login"

	// ✅ 1️⃣ اعتبارسنجی سطح سرویس (Protective Programming)
	if req.PhoneNumber == "" {
		return dto.LoginResponse{}, errors.New("شماره تلفن الزامی است")
	}
	if req.Password == "" {
		return dto.LoginResponse{}, errors.New("رمز عبور الزامی است")
	}

	// 2️⃣ جستجوی کاربر
	user, err := s.repo.GetUserByPhoneNumber(req.PhoneNumber)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return dto.LoginResponse{}, errors.New("کاربری با این شماره تلفن یافت نشد")
		}
		return dto.LoginResponse{}, richerror.New(op).WithErr(err).WithMessage("خطا در جستجوی کاربر")
	}

	// 3️⃣ بررسی رمز عبور
	if !user.VerifyPassword(req.Password) {
		return dto.LoginResponse{}, errors.New("رمز عبور اشتباه است")
	}

	// 4️⃣ تولید توکن
	accessToken, err := s.auth.CreateAccessToken(user)
	if err != nil {
		return dto.LoginResponse{}, richerror.New(op).WithErr(err).WithMessage("خطا در تولید توکن")
	}

	refreshToken, err := s.auth.CreateRefreshToken(user)
	if err != nil {
		return dto.LoginResponse{}, richerror.New(op).WithErr(err).WithMessage("خطا در تولید توکن")
	}

	// 5️⃣ پاسخ موفق
	return dto.LoginResponse{
		UserInfo: dto.UserInfo{
			ID:       string(user.ID),
			Nickname: user.NickName,
			Phone:    user.Phone,
			Role:     user.Role,
		},
		Tokens: dto.Tokens{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
	}, nil
}
