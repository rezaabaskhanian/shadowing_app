package userservice

import (
	"context"
	uservalueobject "shadowing-backend/internal/domain/user/valueobject"

	domain "shadowing-backend/internal/domain/user"
	postgresuser "shadowing-backend/internal/repository/postgres/user"
)

// UserActivity - نام مستعار برای خلاصه‌ی فعالیت یک کاربر (صفحه‌ی کاربران
// پنل ادمین)، دقیقاً همان چیزی که ریپازیتوری برمی‌گرداند.
type UserActivity = postgresuser.UserActivityRow

type Repository interface {
	CreateUser(u domain.User) (domain.User, error)
	GetUserByID(ID string) (domain.User, error)
	GetUserByPhoneNumber(phonenumber string) (domain.User, error)

	ResetPassword(nikname string, hashedPassword uservalueobject.Password) error

	UpdateRole(ctx context.Context, userID, role string) error
	Count(ctx context.Context) (int, error)
	FindAll(ctx context.Context, limit, offset int) ([]domain.User, error)
	CountWithSearch(ctx context.Context, search string) (int, error)
	ListWithActivity(ctx context.Context, limit, offset int, search string) ([]UserActivity, error)
}

type AuthGenerator interface {
	CreateAccessToken(user domain.User) (string, error)
	CreateRefreshToken(user domain.User) (string, error)
}

type Service struct {
	repo Repository
	auth AuthGenerator
}

// // GetUserByID implements [sessionservice.UserService].
// func (s Service) GetUserByID(ID string) (domain.User, error) {
// 	panic("unimplemented")
// }

func New(repo Repository, auth AuthGenerator) Service {
	return Service{repo: repo, auth: auth}
}

// ListUsersWithActivity برای صفحه‌ی کاربران پنل ادمین: کاربرها + خلاصه‌ی
// فعالیتشون (استریک، تعداد صحنه‌ی تکمیل‌شده، آخرین فعالیت، وضعیت اشتراک) +
// تعداد کل برای صفحه‌بندی.
func (s Service) ListUsersWithActivity(ctx context.Context, limit, offset int, search string) ([]UserActivity, int, error) {
	total, err := s.repo.CountWithSearch(ctx, search)
	if err != nil {
		return nil, 0, err
	}
	rows, err := s.repo.ListWithActivity(ctx, limit, offset, search)
	if err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}
