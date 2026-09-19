package aiconversationservice

import (
	"context"

	"shadowing-backend/internal/domain/aiconversation"
	scene "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/pkg/filestore"
	aiservice "shadowing-backend/internal/service/ai"
	"shadowing-backend/internal/service/speecheval"
	ttsservice "shadowing-backend/internal/service/tts"

	"github.com/google/uuid"
)

type ConversationRepository interface {
	Create(ctx context.Context, c *aiconversation.Conversation) error
	GetByID(ctx context.Context, id uuid.UUID) (*aiconversation.Conversation, error)
	UpdateProgress(ctx context.Context, id uuid.UUID, turnCount int, status aiconversation.Status, turnInputTokens, turnOutputTokens int) error
}

type TurnRepository interface {
	Insert(ctx context.Context, t *aiconversation.Turn) error
	ListByConversation(ctx context.Context, conversationID uuid.UUID) ([]aiconversation.Turn, error)
}

// SceneRepository - همان اینترفیسِ سبکی که mission هم استفاده می‌کند؛
// ریپازیتوری جدیدی برای صحنه ساخته نمی‌شود.
type SceneRepository interface {
	GetByID(ctx context.Context, id string) (scene.Scene, error)
}

type Service struct {
	conversations ConversationRepository
	turns         TurnRepository
	scenes        SceneRepository
	ai            aiservice.Service
	tts           ttsservice.Service
	transcriber   speecheval.Transcriber
	store         filestore.Store
}

func New(
	conversations ConversationRepository,
	turns TurnRepository,
	scenes SceneRepository,
	ai aiservice.Service,
	tts ttsservice.Service,
	transcriber speecheval.Transcriber,
	store filestore.Store,
) *Service {
	return &Service{
		conversations: conversations,
		turns:         turns,
		scenes:        scenes,
		ai:            ai,
		tts:           tts,
		transcriber:   transcriber,
		store:         store,
	}
}
