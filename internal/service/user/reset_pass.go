package userservice

import (
	"context"

	uservalueobject "shadowing-backend/internal/domain/user/valueobject"
	"shadowing-backend/internal/pkg/richerror"
	otpservice "shadowing-backend/internal/service/otp"
	"shadowing-backend/internal/service/user/dto"
)

// ResetPassword رمز عبور را با شماره تلفن عوض می‌کند؛ چون بدون احراز هویت
// صدا زده می‌شود، req.OtpToken باید حاصل یک otp/verify موفق برای همین شماره
// (purpose=reset) باشد وگرنه هرکسی با دونستن شماره‌ی هرکسی می‌توانست رمزش
// را عوض کند.
func (s Service) ResetPassword(ctx context.Context, req dto.ResetPasswordRequest) error {

	const op = "userservice.ResetPassword"

	if s.otp != nil {
		if err := s.otp.ConsumeToken(ctx, req.Phone, otpservice.PurposeReset, req.OtpToken); err != nil {
			return err
		}
	}

	user, err := s.repo.GetUserByPhoneNumber(req.Phone)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("کاربری با این شماره پیدا نشد").WithKind(richerror.KindNotFound)
	}

	passHash, err := uservalueobject.NewPassword(req.Password)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("dont create password")
	}

	if errRepo := s.repo.ResetPassword(user.NickName, passHash); errRepo != nil {
		return richerror.New(op).WithErr(errRepo).WithMessage("failed to reset password")
	}

	return nil

}
