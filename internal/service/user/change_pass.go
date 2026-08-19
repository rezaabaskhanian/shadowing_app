package userservice

import (
	uservalueobject "shadowing-backend/internal/domain/user/valueobject"
	"shadowing-backend/internal/pkg/richerror"
)

// ChangePassword رمز عبور کاربر لاگین‌شده را عوض می‌کند (برای پنل ادمین:
// خود ادمین که با JWT معتبر وارد شده رمزش را عوض می‌کند، بدون نیاز به OTP
// چون هویتش قبلاً با توکن احراز شده است).
func (s Service) ChangePassword(userID, newPassword string) error {
	const op = "userservice.ChangePassword"

	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("کاربر پیدا نشد").WithKind(richerror.KindNotFound)
	}

	passHash, err := uservalueobject.NewPassword(newPassword)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("رمز عبور نامعتبر است").WithKind(richerror.KindInvalid)
	}

	if err := s.repo.ResetPassword(user.NickName, passHash); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در تغییر رمز عبور")
	}

	return nil
}
