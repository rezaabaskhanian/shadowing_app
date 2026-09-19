package aiconversationservice

import (
	"context"

	"shadowing-backend/internal/domain/aiconversation"
	"shadowing-backend/internal/domain/assessment"
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

// HintRepository - پیشنهادهای جواب (Hint). GetByTurn وقتی هنوز Hintی برای آن
// نوبت ساخته نشده (nil, nil) برمی‌گرداند.
type HintRepository interface {
	Insert(ctx context.Context, h *aiconversation.Hint) error
	GetByTurn(ctx context.Context, conversationID uuid.UUID, turnIndex int) (*aiconversation.Hint, error)
	GetByID(ctx context.Context, id uuid.UUID) (*aiconversation.Hint, error)
	CountByConversation(ctx context.Context, conversationID uuid.UUID) (int, error)
}

// ProfileRepository - فقط برای خواندنِ سطحِ کاربر، تا پیشنهادها با توانِ او
// هماهنگ باشند (همان ریپازیتوریِ assessment، بدون ریپازیتوریِ جدید).
type ProfileRepository interface {
	GetByUser(ctx context.Context, userID uuid.UUID) (*assessment.SpeakingProfile, error)
}

// SceneRepository - همان اینترفیسِ سبکی که mission هم استفاده می‌کند؛
// ریپازیتوری جدیدی برای صحنه ساخته نمی‌شود.
type SceneRepository interface {
	GetByID(ctx context.Context, id string) (scene.Scene, error)
}

type Service struct {
	conversations ConversationRepository
	turns         TurnRepository
	hints         HintRepository
	profiles      ProfileRepository
	scenes        SceneRepository
	ai            aiservice.Service
	tts           ttsservice.Service
	transcriber   speecheval.Transcriber
	store         filestore.Store
}

func New(
	conversations ConversationRepository,
	turns TurnRepository,
	hints HintRepository,
	profiles ProfileRepository,
	scenes SceneRepository,
	ai aiservice.Service,
	tts ttsservice.Service,
	transcriber speecheval.Transcriber,
	store filestore.Store,
) *Service {
	return &Service{
		conversations: conversations,
		turns:         turns,
		hints:         hints,
		profiles:      profiles,
		scenes:        scenes,
		ai:            ai,
		tts:           tts,
		transcriber:   transcriber,
		store:         store,
	}
}
