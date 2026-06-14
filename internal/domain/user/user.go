package user

import (
	"errors"
	"regexp"
	uservalueobject "shadowing-backend/internal/domain/user/valueobject"
	"time"
)

type User struct {
	ID        uservalueobject.UserID
	NickName  string
	Password  uservalueobject.Password
	Phone     string
	Role      string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// ✅ تابع اعتبارسنجی شماره تلفن
func validatePhoneNumber(phone string) error {
	// 1. نباید خالی باشد
	if phone == "" {
		return errors.New("شماره تلفن نمی‌تواند خالی باشد")
	}

	// 2. باید با 09 شروع شود
	if !regexp.MustCompile(`^09`).MatchString(phone) {
		return errors.New("شماره تلفن باید با 09 شروع شود")
	}

	// 3. باید 11 رقم باشد (09123456789)
	if len(phone) != 11 {
		return errors.New("شماره تلفن باید 11 رقم باشد")
	}

	// 4. همه کاراکترها باید رقم باشند
	if !regexp.MustCompile(`^[0-9]+$`).MatchString(phone) {
		return errors.New("شماره تلفن باید فقط شامل اعداد باشد")
	}

	return nil
}

func NewUser(nickname string, password string, phone string, role string) (User, error) {

	if nickname == "" || phone == "" || password == "" {
		return User{}, errors.New(" لطفا همه موارد را پر کنید ")
	}

	// ========== 2️⃣ اعتبارسنجی شماره تلفن ==========
	if err := validatePhoneNumber(phone); err != nil {
		return User{}, err
	}

	uid := uservalueobject.NewUserID()

	pass, err := uservalueobject.NewPassword(password)

	if err != nil {
		return User{}, err
	}

	now := time.Now()

	return User{
		ID:        uid,
		NickName:  nickname,
		Password:  pass,
		Phone:     phone,
		Role:      role,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil

}

// Method to verify password
func (u *User) VerifyPassword(plain string) bool {
	return u.Password.Verify(plain)
}
