package postgresaiconversation

import (
	"context"

	"shadowing-backend/internal/domain/aiconversation"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TurnRepository struct {
	db *pgxpool.Pool
}

func NewTurnRepository(db *pgxpool.Pool) *TurnRepository {
	return &TurnRepository{db: db}
}

const turnColumns = `id, conversation_id, role, text, audio_url, order_index, created_at, grammar_correction, grammar_explanation`

func scanTurn(row pgx.Row) (*aiconversation.Turn, error) {
	var t aiconversation.Turn
	var audioURL, grammarCorrection, grammarExplanation *string
	if err := row.Scan(
		&t.ID, &t.ConversationID, &t.Role, &t.Text, &audioURL, &t.OrderIndex, &t.CreatedAt,
		&grammarCorrection, &grammarExplanation,
	); err != nil {
		return nil, err
	}
	if audioURL != nil {
		t.AudioURL = *audioURL
	}
	if grammarCorrection != nil {
		t.GrammarCorrection = *grammarCorrection
	}
	if grammarExplanation != nil {
		t.GrammarExplanation = *grammarExplanation
	}
	return &t, nil
}

// Insert - ثبت یک نوبت تازه (کاربر یا assistant)
func (r *TurnRepository) Insert(ctx context.Context, t *aiconversation.Turn) error {
	const op = "postgresaiconversation.TurnRepository.Insert"

	query := `INSERT INTO ai_conversation_turns (id, conversation_id, role, text, audio_url, order_index, created_at, grammar_correction, grammar_explanation)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := r.db.Exec(ctx, query,
		t.ID, t.ConversationID, t.Role, t.Text, nullable(t.AudioURL), t.OrderIndex, t.CreatedAt,
		nullable(t.GrammarCorrection), nullable(t.GrammarExplanation),
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to insert conversation turn")
	}
	return nil
}

// ListByConversation - همه‌ی نوبت‌های یک گفتگو، به ترتیب
func (r *TurnRepository) ListByConversation(ctx context.Context, conversationID uuid.UUID) ([]aiconversation.Turn, error) {
	const op = "postgresaiconversation.TurnRepository.ListByConversation"

	query := `SELECT ` + turnColumns + ` FROM ai_conversation_turns WHERE conversation_id = $1 ORDER BY order_index`
	rows, err := r.db.Query(ctx, query, conversationID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var turns []aiconversation.Turn
	for rows.Next() {
		t, err := scanTurn(rows)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		turns = append(turns, *t)
	}
	return turns, nil
}

func nullable(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
