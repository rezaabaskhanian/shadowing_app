package postgresaiconversation

import (
	"context"
	"encoding/json"

	"shadowing-backend/internal/domain/aiconversation"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HintRepository struct {
	db *pgxpool.Pool
}

func NewHintRepository(db *pgxpool.Pool) *HintRepository {
	return &HintRepository{db: db}
}

const hintColumns = `id, conversation_id, turn_index, suggestions, input_tokens, output_tokens, created_at`

func scanHint(row pgx.Row) (*aiconversation.Hint, error) {
	var h aiconversation.Hint
	var raw []byte
	var inputTokens, outputTokens *int
	if err := row.Scan(&h.ID, &h.ConversationID, &h.TurnIndex, &raw, &inputTokens, &outputTokens, &h.CreatedAt); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(raw, &h.Suggestions); err != nil {
		return nil, err
	}
	if inputTokens != nil {
		h.InputTokens = *inputTokens
	}
	if outputTokens != nil {
		h.OutputTokens = *outputTokens
	}
	return &h, nil
}

// Insert - ثبت یک Hint. اگر برای همین نوبت قبلاً ردیفی ثبت شده باشد (مثلاً دو
// درخواستِ همزمان)، بی‌صدا نادیده گرفته می‌شود؛ صدا‌زننده بعدش با GetByTurn
// همان ردیفِ برنده را می‌خواند.
func (r *HintRepository) Insert(ctx context.Context, h *aiconversation.Hint) error {
	const op = "postgresaiconversation.HintRepository.Insert"

	raw, err := json.Marshal(h.Suggestions)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}

	query := `INSERT INTO ai_conversation_hints (id, conversation_id, turn_index, suggestions, input_tokens, output_tokens, created_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7)
	ON CONFLICT (conversation_id, turn_index) DO NOTHING`

	if _, err := r.db.Exec(ctx, query,
		h.ID, h.ConversationID, h.TurnIndex, raw, nullableInt(h.InputTokens), nullableInt(h.OutputTokens), h.CreatedAt,
	); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to insert hint")
	}
	return nil
}

// GetByTurn - Hintِ یک نوبت؛ اگر هنوز ساخته نشده باشد (nil, nil) برمی‌گرداند
// چون نبودنش حالتِ عادی است، نه خطا.
func (r *HintRepository) GetByTurn(ctx context.Context, conversationID uuid.UUID, turnIndex int) (*aiconversation.Hint, error) {
	const op = "postgresaiconversation.HintRepository.GetByTurn"

	query := `SELECT ` + hintColumns + ` FROM ai_conversation_hints WHERE conversation_id = $1 AND turn_index = $2`
	h, err := scanHint(r.db.QueryRow(ctx, query, conversationID, turnIndex))
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, richerror.New(op).WithErr(err)
	}
	return h, nil
}

// GetByID - خواندن یک Hint با شناسه
func (r *HintRepository) GetByID(ctx context.Context, id uuid.UUID) (*aiconversation.Hint, error) {
	const op = "postgresaiconversation.HintRepository.GetByID"

	query := `SELECT ` + hintColumns + ` FROM ai_conversation_hints WHERE id = $1`
	h, err := scanHint(r.db.QueryRow(ctx, query, id))
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, richerror.New(op).WithMessage("hint not found").WithKind(richerror.KindNotFound)
		}
		return nil, richerror.New(op).WithErr(err)
	}
	return h, nil
}

// CountByConversation - تعدادِ پیشنهادهای مصرف‌شده در یک گفتگو
func (r *HintRepository) CountByConversation(ctx context.Context, conversationID uuid.UUID) (int, error) {
	const op = "postgresaiconversation.HintRepository.CountByConversation"

	var n int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM ai_conversation_hints WHERE conversation_id = $1`, conversationID).Scan(&n); err != nil {
		return 0, richerror.New(op).WithErr(err)
	}
	return n, nil
}
