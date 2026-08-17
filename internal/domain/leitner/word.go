package leitner

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

const (
	MinLevel = 1
	MaxLevel = 5
)

// levelIntervalDays - فاصله‌ی روز تا مرور بعدی برای هر سطح. عیناً همان
// جدولی است که سمت موبایل (app/src/data/VocabContext.tsx) استفاده می‌شود،
// تا رفتار سرور با چیزی که کاربر قبلاً روی گوشی دیده یکی باشد.
var levelIntervalDays = map[int]int{
	1: 1,
	2: 2,
	3: 4,
	4: 7,
	5: 15,
}

// Word - یک کلمه در جعبه‌ی لایتنر کاربر
type Word struct {
	ID         uuid.UUID
	UserID     uuid.UUID
	Word       string
	Meaning    string
	Level      int
	NextReview time.Time
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func NewWord(userID uuid.UUID, word, meaning string) (Word, error) {
	if userID == uuid.Nil {
		return Word{}, errors.New("user ID is required")
	}
	if word == "" {
		return Word{}, errors.New("word is required")
	}
	if meaning == "" {
		return Word{}, errors.New("meaning is required")
	}

	now := time.Now()
	return Word{
		ID:         uuid.New(),
		UserID:     userID,
		Word:       word,
		Meaning:    meaning,
		Level:      MinLevel,
		NextReview: now.AddDate(0, 0, levelIntervalDays[MinLevel]),
		CreatedAt:  now,
		UpdatedAt:  now,
	}, nil
}

// Promote - کاربر «بلد بودم» زده؛ سطح یکی بالا می‌رود (حداکثر MaxLevel) و
// مرور بعدی دیرتر می‌شود.
func (w *Word) Promote() {
	if w.Level < MaxLevel {
		w.Level++
	}
	w.NextReview = time.Now().AddDate(0, 0, levelIntervalDays[w.Level])
	w.UpdatedAt = time.Now()
}

// Demote - کاربر «بلد نبودم» زده؛ سطح به ۱ برمی‌گردد و مرور بعدی زودتر
// می‌شود.
func (w *Word) Demote() {
	w.Level = MinLevel
	w.NextReview = time.Now().AddDate(0, 0, levelIntervalDays[MinLevel])
	w.UpdatedAt = time.Now()
}
