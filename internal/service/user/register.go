package userservice

import (
	"context"
	"errors"
	"fmt"
	domain "shadowing-backend/internal/domain/user"
	"shadowing-backend/internal/pkg/errmesg"
	otpservice "shadowing-backend/internal/service/otp"
	"shadowing-backend/internal/service/user/dto"
	"strings"

	"github.com/jackc/pgx/v5"
)

func (s Service) Register(ctx context.Context, req dto.RegisterRequest) (dto.RegisterResponse, error) {

	const op = "user.Register"

	// شماره باید قبلاً با پیامک تایید شده باشد (register.go در otp service)
	if s.otp != nil {
		if err := s.otp.ConsumeToken(ctx, req.Phone, otpservice.PurposeRegister, req.OtpToken); err != nil {
			return dto.RegisterResponse{}, err
		}
	}

	// ========== 1️⃣ Validation در لایه Application ==========

	_, err := s.repo.GetUserByPhoneNumber(req.Phone)

	if err == nil {
		// کاربر وجود دارد - خطای تکراری
		return dto.RegisterResponse{}, errors.New(errmesg.ErrorMsgPhoneNumberIsNotUniqe)
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		// یک خطای واقعی دیتابیس (غیر از "یافت نشد")
		return dto.RegisterResponse{}, fmt.Errorf("database error: %w", err)
	}
	// نقش همیشه "user" است؛ کلاینت نمی‌تواند از طریق ثبت‌نام عمومی نقش ادمین بگیرد.
	user, err := domain.NewUser(
		req.Nickname, req.Password, req.Phone, "user",
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
