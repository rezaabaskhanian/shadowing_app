package aiconversation

import (
	"time"

	"github.com/google/uuid"
)

// Conversation - یک گفتگوی آزاد صوتی بین کاربر و AI، بعد از تمام‌شدنِ یک صحنه.
type Conversation struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	SceneID   uuid.UUID
	Status    Status
	TurnCount int
	// TotalInputTokens/TotalOutputTokens مجموعِ مصرفِ توکنِ همه‌ی فراخوانی‌های
	// converse() این گفتگو است (برای گزارشِ هزینه، بدون نیاز به SUM روی turns).
	TotalInputTokens  int
	TotalOutputTokens int
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

// NewConversation یک گفتگوی تازه و فعال می‌سازد.
func NewConversation(userID, sceneID uuid.UUID) (*Conversation, error) {
	now := time.Now()
	return &Conversation{
		ID:        uuid.New(),
		UserID:    userID,
		SceneID:   sceneID,
		Status:    StatusActive,
		TurnCount: 0,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}
