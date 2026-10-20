package assessment

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// AssessmentItem - یک آیتم تست تعیین سطح (مدیریت‌شده در پنل ادمین)
type AssessmentItem struct {
	ID         uuid.UUID
	Kind       Kind
	Category   Category
	PromptText string
	TargetText string // فقط برای kind=shadow
	AudioURL   string // فقط برای kind=shadow
	Difficulty Difficulty
	// نسخه‌ی ۲: CEFR برای listen_choice و imitation؛ Band (1..5) و IsPseudo
	// برای vocab_yesno؛ Options و CorrectIndex برای listen_choice.
	CEFR         Level
	Band         int
	IsPseudo     bool
	Options      []string
	CorrectIndex int
	IsActive     bool
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// NewAssessmentItem یک آیتم جدید می‌سازد و الزامات هر kind را بررسی می‌کند.
func NewAssessmentItem(kind Kind, category Category, promptText, targetText, audioURL string, difficulty Difficulty) (*AssessmentItem, error) {
	if promptText == "" {
		return nil, errors.New("prompt text is required")
	}

	switch kind {
	case KindShadow:
		if targetText == "" {
			return nil, errors.New("shadow items require target text")
		}
		if audioURL == "" {
			return nil, errors.New("shadow items require a reference audio")
		}
	case KindFreeSpeech:
		if category != CategoryIntro && category != CategorySituational {
			return nil, errors.New("free_speech items require a valid category")
		}
	case KindVocabYesNo, KindListenChoice, KindImitation:
		// فیلدهای نسخه‌ی ۲ در ValidateV2 بررسی می‌شوند (بعد از پر شدن).
	default:
		return nil, errors.New("invalid assessment item kind")
	}

	now := time.Now()
	if kind == KindVocabYesNo || kind == KindListenChoice || kind == KindImitation {
		category = CategorySituational // ستون category در پایگاه‌داده NOT NULL است
	}

	return &AssessmentItem{
		ID:         uuid.New(),
		Kind:       kind,
		Category:   category,
		PromptText: promptText,
		TargetText: targetText,
		AudioURL:   audioURL,
		Difficulty: difficulty,
		IsActive:   true,
		CreatedAt:  now,
		UpdatedAt:  now,
	}, nil
}

// ValidateV2 فیلدهای مخصوص آیتم‌های نسخه‌ی ۲ را بررسی می‌کند؛ برای kindهای
// قدیمی کاری نمی‌کند.
func (it *AssessmentItem) ValidateV2() error {
	switch it.Kind {
	case KindVocabYesNo:
		if it.Band < 1 || it.Band > 5 {
			return errors.New("vocab items require band 1..5")
		}
	case KindListenChoice:
		if !ValidLevel(string(it.CEFR)) {
			return errors.New("listening items require a CEFR level (A1..C1)")
		}
		if it.TargetText == "" || it.AudioURL == "" {
			return errors.New("listening items require the sentence text and its audio")
		}
		if len(it.Options) < 2 {
			return errors.New("listening items require at least two options")
		}
		if it.CorrectIndex < 0 || it.CorrectIndex >= len(it.Options) {
			return errors.New("listening items require a valid correct option")
		}
	case KindImitation:
		if !ValidLevel(string(it.CEFR)) {
			return errors.New("imitation items require a CEFR level (A1..C1)")
		}
		if it.TargetText == "" || it.AudioURL == "" {
			return errors.New("imitation items require the sentence text and its audio")
		}
	}
	return nil
}
