package postgresfreespeech

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

// nullable رشته‌ی خالی را به NULL تبدیل می‌کند — عیناً هم‌الگوی
// postgresassessment.SubmissionLogRepository.
func nullable(s string) any {
	if s == "" {
		return nil
	}
	return s
}

// Insert لاگِ ممیزیِ یک تلاشِ Free Speech را ثبت می‌کند — بدون صفحه‌ی
// تاریخچه‌ی جداگانه، عیناً هم‌نقش assessment_submission_items.
func (r DB) Insert(ctx context.Context, userID, sceneID uuid.UUID, transcript, relevanceAnswered, relevanceFeedback, grammarCorrection, grammarExplanation string) error {
	const op = "postgresfreespeech.Insert"

	const query = `
		INSERT INTO free_speech_attempts
			(id, user_id, scene_id, transcript, relevance_answered, relevance_feedback, grammar_correction, grammar_explanation, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
	`
	_, err := r.conn.Exec(ctx, query, uuid.New(), userID, sceneID,
		nullable(transcript), nullable(relevanceAnswered), nullable(relevanceFeedback), nullable(grammarCorrection), nullable(grammarExplanation),
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to log free speech attempt")
	}
	return nil
}
