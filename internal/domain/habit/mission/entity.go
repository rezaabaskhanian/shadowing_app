package mission

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Type - نوع ماموریت عادت. فعلاً فقط یک نوع وجود دارد: تمرین یک دیالوگ در
// دلِ یک موقعیت واقعی روزمره (مثلاً موقع ریختن قهوه)؛ تکرارش هم بخشی از
// همان تمرین است، نه یک نوع جدا.
type Type string

const (
	TypeRealLife Type = "real_life"
)

// Status - وضعیت ماموریت
type Status string

const (
	StatusAssigned   Status = "assigned"
	StatusInProgress Status = "in_progress"
	StatusCompleted  Status = "completed"
)

// Mission - یک ماموریت عادت روزانه: یک هات‌اسپات مشخص که کاربر باید در قالب
// یک فعالیت روزمره (مثلاً دم‌کردن چای) با صدای بلند تمرین کند.
type Mission struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	HotspotID       uuid.UUID
	ActivityID      uuid.UUID
	Type            Type
	Status          Status
	StartedAt       *time.Time
	CompletedAt     *time.Time
	DurationSeconds int
	CreatedAt       time.Time
}

func New(userID, hotspotID, activityID uuid.UUID, missionType Type) (Mission, error) {
	if userID == uuid.Nil {
		return Mission{}, errors.New("user ID is required")
	}
	if hotspotID == uuid.Nil {
		return Mission{}, errors.New("hotspot ID is required")
	}
	if activityID == uuid.Nil {
		return Mission{}, errors.New("activity ID is required")
	}
	if missionType != TypeRealLife {
		return Mission{}, errors.New("invalid mission type")
	}

	return Mission{
		ID:         uuid.New(),
		UserID:     userID,
		HotspotID:  hotspotID,
		ActivityID: activityID,
		Type:       missionType,
		Status:     StatusAssigned,
		CreatedAt:  time.Now(),
	}, nil
}

func (m *Mission) Start() {
	if m.Status == StatusCompleted {
		return
	}
	now := time.Now()
	m.Status = StatusInProgress
	m.StartedAt = &now
}

func (m *Mission) Complete(durationSeconds int) {
	now := time.Now()
	m.Status = StatusCompleted
	m.CompletedAt = &now
	m.DurationSeconds = durationSeconds
}
