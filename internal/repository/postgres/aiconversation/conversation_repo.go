package postgresaiconversation

import (
	"context"

	"shadowing-backend/internal/domain/aiconversation"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ConversationRepository struct {
	db *pgxpool.Pool
}

func NewConversationRepository(db *pgxpool.Pool) *ConversationRepository {
	return &ConversationRepository{db: db}
}

const conversationColumns = `id, user_id, scene_id, status, turn_count, created_at, updated_at`

func scanConversation(row pgx.Row) (*aiconversation.Conversation, error) {
	var c aiconversation.Conversation
	if err := row.Scan(&c.ID, &c.UserID, &c.SceneID, &c.Status, &c.TurnCount, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}
	return &c, nil
}

// Create - ثبت یک گفتگوی تازه
func (r *ConversationRepository) Create(ctx context.Context, c *aiconversation.Conversation) error {
	const op = "postgresaiconversation.ConversationRepository.Create"

	query := `INSERT INTO ai_conversations (id, user_id, scene_id, status, turn_count, created_at, updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err := r.db.Exec(ctx, query, c.ID, c.UserID, c.SceneID, c.Status, c.TurnCount, c.CreatedAt, c.UpdatedAt)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to create conversation")
	}
	return nil
}

// GetByID - خواندن یک گفتگو با شناسه
func (r *ConversationRepository) GetByID(ctx context.Context, id uuid.UUID) (*aiconversation.Conversation, error) {
	const op = "postgresaiconversation.ConversationRepository.GetByID"

	query := `SELECT ` + conversationColumns + ` FROM ai_conversations WHERE id = $1`
	c, err := scanConversation(r.db.QueryRow(ctx, query, id))
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, richerror.New(op).WithMessage("conversation not found").WithKind(richerror.KindNotFound)
		}
		return nil, richerror.New(op).WithErr(err)
	}
	return c, nil
}

// UpdateProgress - بعد از هر نوبت، تعداد نوبت‌ها و وضعیت را به‌روز می‌کند
func (r *ConversationRepository) UpdateProgress(ctx context.Context, id uuid.UUID, turnCount int, status aiconversation.Status) error {
	const op = "postgresaiconversation.ConversationRepository.UpdateProgress"

	query := `UPDATE ai_conversations SET turn_count = $1, status = $2, updated_at = now() WHERE id = $3`
	result, err := r.db.Exec(ctx, query, turnCount, status, id)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to update conversation progress")
	}
	if result.RowsAffected() == 0 {
		return richerror.New(op).WithMessage("conversation not found").WithKind(richerror.KindNotFound)
	}
	return nil
}
