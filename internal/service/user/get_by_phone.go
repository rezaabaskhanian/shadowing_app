package userservice

import (
	domain "shadowing-backend/internal/domain/user"
	"shadowing-backend/internal/pkg/richerror"
)

// GetUserByPhone یک کاربر را با شماره تلفن پیدا می‌کند (برای پنل ادمین، مثلاً
// فعال‌سازی دستی اشتراک بدون نیاز به شناسه کاربر).
func (s Service) GetUserByPhone(phone string) (domain.User, error) {
	const op = "userservice.GetUserByPhone"

	user, err := s.repo.GetUserByPhoneNumber(phone)
	if err != nil {
		return domain.User{}, richerror.New(op).WithErr(err).WithMessage("کاربری با این شماره پیدا نشد")
	}
	return user, nil
}
