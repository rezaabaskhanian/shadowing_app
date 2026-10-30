package userservice

import (
	"context"
	"strings"
	"unicode/utf8"

	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/user/dto"
)

const (
	minNicknameLen = 2
	maxNicknameLen = 30
)

// UpdateProfile نام نمایشی کاربر لاگین‌شده را عوض می‌کند و پروفایل تازه را
// برمی‌گرداند. شماره تلفن اینجا عوض نمی‌شود چون شناسه‌ی ورود است و بدون
// تایید پیامکیِ شماره‌ی جدید نباید تغییر کند.
func (s Service) UpdateProfile(ctx context.Context, userID, nickname string) (dto.ProfileResponse, error) {
	const op = "userservice.UpdateProfile"

	nickname = strings.Join(strings.Fields(nickname), " ")
	if n := utf8.RuneCountInString(nickname); n < minNicknameLen || n > maxNicknameLen {
		return dto.ProfileResponse{}, richerror.New(op).
			WithMessage("نام باید بین ۲ تا ۳۰ حرف باشد").
			WithKind(richerror.KindInvalid)
	}

	if err := s.repo.UpdateNickname(ctx, userID, nickname); err != nil {
		return dto.ProfileResponse{}, richerror.New(op).WithErr(err).WithMessage("ذخیره‌ی نام انجام نشد")
	}

	return s.Profile(userID)
}
