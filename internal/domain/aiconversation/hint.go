package aiconversation

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Suggestion - یک جمله‌ی پیشنهادی برای جواب‌دادن به AI.
type Suggestion struct {
	Text          string `json:"text"`
	TranslationFA string `json:"translation_fa"`
	// AudioURL فقط بعد از اولین درخواستِ پخشِ همین جمله پر می‌شود.
	AudioURL string `json:"audio_url,omitempty"`
}

// Hint - پیشنهادهای یک نوبتِ AI. TurnIndex همان OrderIndex نوبتِ assistant
// است که کاربر می‌خواهد به آن جواب بدهد.
type Hint struct {
	ID             uuid.UUID
	ConversationID uuid.UUID
	TurnIndex      int
	Suggestions    []Suggestion
	InputTokens    int
	OutputTokens   int
	CreatedAt      time.Time
}

// NewHint یک Hint تازه می‌سازد.
func NewHint(conversationID uuid.UUID, turnIndex int, suggestions []Suggestion) (*Hint, error) {
	if len(suggestions) == 0 {
		return nil, errors.New("hint needs at least one suggestion")
	}
	return &Hint{
		ID:             uuid.New(),
		ConversationID: conversationID,
		TurnIndex:      turnIndex,
		Suggestions:    suggestions,
		CreatedAt:      time.Now(),
	}, nil
}
