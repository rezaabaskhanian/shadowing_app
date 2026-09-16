package aiconversation

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Turn - یک نوبت از گفتگو (یا کاربر یا AI).
type Turn struct {
	ID             uuid.UUID
	ConversationID uuid.UUID
	Role           Role
	Text           string
	AudioURL       string // فقط برای Role=RoleAssistant پر می‌شود
	OrderIndex     int
	CreatedAt      time.Time
	// GrammarCorrection/GrammarExplanation فقط برای Role=RoleUser پر می‌شوند،
	// و فقط وقتی خطای گرامریِ قابل‌توجهی پیدا شده باشد — بعد از ساخته‌شدنِ
	// Turn توسط NewTurn مستقیم ست می‌شوند، نه بخشی از constructor.
	GrammarCorrection  string
	GrammarExplanation string
}

// NewTurn یک نوبتِ تازه می‌سازد.
func NewTurn(conversationID uuid.UUID, role Role, text, audioURL string, orderIndex int) (*Turn, error) {
	if role != RoleUser && role != RoleAssistant {
		return nil, errors.New("invalid turn role")
	}
	if text == "" {
		return nil, errors.New("turn text is required")
	}

	return &Turn{
		ID:             uuid.New(),
		ConversationID: conversationID,
		Role:           role,
		Text:           text,
		AudioURL:       audioURL,
		OrderIndex:     orderIndex,
		CreatedAt:      time.Now(),
	}, nil
}
