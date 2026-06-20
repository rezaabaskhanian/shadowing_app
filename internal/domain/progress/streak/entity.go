package streak

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Streak - رکورد استریک روزانه کاربر
type Streak struct {
	ID        uuid.UUID    `json:"id"`
	UserID    uuid.UUID    `json:"user_id"`
	Current   int          `json:"current"`   // استریک فعلی
	Longest   int          `json:"longest"`   // طولانی‌ترین استریک
	LastDate  time.Time    `json:"last_date"` // آخرین روز تمرین
	Status    StreakStatus `json:"status"`
	Freezes   int          `json:"freezes"` // تعداد فریزهای موجود
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}

// ============================================
// سازنده Streak جدید
// ============================================
func NewStreak(userID uuid.UUID) (*Streak, error) {
	if userID == uuid.Nil {
		return nil, errors.New("user ID is required")
	}

	now := time.Now()
	return &Streak{
		ID:        uuid.New(),
		UserID:    userID,
		Current:   0,
		Longest:   0,
		LastDate:  now,
		Status:    StreakActive,
		Freezes:   2, // ۲ فریز رایگان برای شروع
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// ============================================
// متدهای Streak
// ============================================

// AddDay - اضافه کردن یک روز به استریک
func (s *Streak) AddDay() {
	now := time.Now()
	yesterday := now.AddDate(0, 0, -1)

	// اگر امروز قبلاً ثبت شده، کاری نکن
	if s.LastDate.Format("2006-01-02") == now.Format("2006-01-02") {
		return
	}

	// اگر دیروز ثبت شده بود، استریک ادامه دارد
	if s.LastDate.Format("2006-01-02") == yesterday.Format("2006-01-02") {
		s.Current++
	} else {
		// استریک شکسته شده - از امروز شروع کن
		s.Current = 1
	}

	// به‌روزرسانی طولانی‌ترین استریک
	if s.Current > s.Longest {
		s.Longest = s.Current
	}

	s.LastDate = now
	s.Status = StreakActive
	s.UpdatedAt = now
}

// Break - شکستن استریک
func (s *Streak) Break() {
	s.Current = 0
	s.Status = StreakBroken
	s.UpdatedAt = time.Now()
}

// Recover - بازیابی استریک با فریز
func (s *Streak) Recover() error {
	if s.Freezes <= 0 {
		return errors.New("no freezes available")
	}

	s.Freezes--
	s.Status = StreakRecovered
	s.UpdatedAt = time.Now()
	return nil
}
