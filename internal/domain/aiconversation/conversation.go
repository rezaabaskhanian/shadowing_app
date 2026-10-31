package aiconversation

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Conversation - یک گفتگوی آزاد صوتی بین کاربر و AI، بعد از تمام‌شدنِ یک صحنه
// یا روی یک سناریوی نقش‌آفرینی. دقیقاً یکی از SceneID/RoleplayID پر است (uuid.Nil یعنی خالی).
type Conversation struct {
	ID         uuid.UUID
	UserID     uuid.UUID
	SceneID    uuid.UUID
	RoleplayID uuid.UUID
	Status     Status
	TurnCount  int
	// TotalInputTokens/TotalOutputTokens مجموعِ مصرفِ توکنِ همه‌ی فراخوانی‌های
	// converse() این گفتگو است (برای گزارشِ هزینه، بدون نیاز به SUM روی turns).
	TotalInputTokens  int
	TotalOutputTokens int
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

// NewConversation یک گفتگوی تازه و فعال می‌سازد؛ یکی از sceneID/roleplayID باید پر باشد.
func NewConversation(userID, sceneID, roleplayID uuid.UUID) (*Conversation, error) {
	if (sceneID == uuid.Nil) == (roleplayID == uuid.Nil) {
		return nil, errors.New("conversation needs exactly one of scene or roleplay")
	}
	now := time.Now()
	return &Conversation{
		ID:         uuid.New(),
		UserID:     userID,
		SceneID:    sceneID,
		RoleplayID: roleplayID,
		Status:     StatusActive,
		TurnCount:  0,
		CreatedAt:  now,
		UpdatedAt:  now,
	}, nil
}
