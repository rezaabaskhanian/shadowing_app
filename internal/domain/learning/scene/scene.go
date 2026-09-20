package scence

import (
	"errors"
	"time"
)

// GrammarExample یک جمله‌ی مثال برای نکته‌ی گرامری صحنه است (خودِ جمله‌ی انگلیسی
// همراه با ترجمه‌ی فارسی). مثال‌ها از دیالوگ‌های همین صحنه گرفته می‌شوند.
type GrammarExample struct {
	Text        string `json:"text"`
	Translation string `json:"translation"`
}

// MaxGrammarExamples سقفِ تعداد مثال‌های نکته‌ی گرامری هر صحنه.
const MaxGrammarExamples = 4

type Scene struct {
	ID                 SceneID
	Title              string
	Description        string
	BackgroundImageURL string
	Difficulty         DifficultyLevel
	Status             SceneStatus
	Hotspots           []Hotspot
	Order              int
	IsLocked           bool
	Category           string
	// نکته‌ی گرامریِ اختیاری: موضوعی که ادمین داده، توضیح فارسیِ کوتاه و ۲ تا ۴ مثال.
	// همه‌ی فیلدها می‌توانند خالی باشند (صحنه‌ی بدون نکته‌ی گرامری).
	GrammarTopic       string
	GrammarExplanation string
	GrammarExamples    []GrammarExample
	// GrammarAudioURL صدای تولیدشده (ElevenLabs، عیناً هم‌الگوی صدای دیالوگ‌ها)
	// برای GrammarExplanation است — برای کاربری که حوصله‌ی خواندن ندارد.
	GrammarAudioURL string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func NewScene(title, description, bgImage string, difficulty DifficultyLevel, isLocked bool, category string) (Scene, error) {
	if title == "" {
		return Scene{}, errors.New("title is required")
	}
	if bgImage == "" {
		return Scene{}, errors.New("background image is required")
	}

	now := time.Now()

	seneID := NewSenceID()

	return Scene{
		ID:                 seneID,
		Title:              title,
		Description:        description,
		BackgroundImageURL: bgImage,
		Difficulty:         difficulty,
		Status:             StatusDraft,
		Hotspots:           []Hotspot{},
		IsLocked:           isLocked,
		Category:           category,
		CreatedAt:          now,
		UpdatedAt:          now,
	}, nil
}

func (s *Scene) Publish() error {
	if len(s.Hotspots) == 0 {
		return errors.New("cannot publish scene without hotspots")
	}
	s.Status = StatusPublished
	s.UpdatedAt = time.Now()
	return nil
}

func (s *Scene) AddHotspot(hotspot Hotspot) {
	s.Hotspots = append(s.Hotspots, hotspot)
	s.UpdatedAt = time.Now()
}
