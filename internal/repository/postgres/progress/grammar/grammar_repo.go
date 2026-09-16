package postgresgrammar

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GrammarRepository struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *GrammarRepository {
	return &GrammarRepository{db: db}
}

// CleanRate تعداد رونویسیِ آزادِ کاربر بدون خطای گرامری (clean) و کل تعداد
// رونویسیِ آزاد او را برمی‌گرداند — از هر دو منبعی که Grammar Feedback در
// آن‌ها ثبت می‌شود: آیتم‌های free_speech تست تعیین سطح، و نوبت‌های کاربر در
// AI Conversation.
func (r *GrammarRepository) CleanRate(ctx context.Context, userID uuid.UUID) (clean, total int, err error) {
	const op = "postgresgrammar.GrammarRepository.CleanRate"

	query := `
		WITH combined AS (
			SELECT grammar_correction FROM assessment_submission_items
			WHERE user_id = $1 AND transcript IS NOT NULL AND transcript <> ''
			UNION ALL
			SELECT t.grammar_correction FROM ai_conversation_turns t
			JOIN ai_conversations c ON c.id = t.conversation_id
			WHERE c.user_id = $1 AND t.role = 'user'
		)
		SELECT COUNT(*) FILTER (WHERE grammar_correction IS NULL), COUNT(*) FROM combined`

	if err := r.db.QueryRow(ctx, query, userID).Scan(&clean, &total); err != nil {
		return 0, 0, richerror.New(op).WithErr(err)
	}
	return clean, total, nil
}
