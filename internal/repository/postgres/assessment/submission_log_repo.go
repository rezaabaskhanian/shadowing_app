package postgresassessment

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SubmissionLogRepository struct {
	db *pgxpool.Pool
}

func NewSubmissionLogRepository(db *pgxpool.Pool) *SubmissionLogRepository {
	return &SubmissionLogRepository{db: db}
}

// Insert - لاگ متنی یک آیتم ارسالی (بدون صدا). نمره‌ها برای آیتم‌های
// free_speech نال می‌مانند تا نمره‌ی ساختگی ذخیره نشود.
func (r *SubmissionLogRepository) Insert(
	ctx context.Context,
	userID, itemID uuid.UUID,
	transcript, relevanceAnswered, relevanceFeedback string,
	pronunciationScore, fluencyScore, overallScore *float64,
) error {
	const op = "postgresassessment.SubmissionLogRepository.Insert"

	query := `INSERT INTO assessment_submission_items (
		id, user_id, item_id, transcript, relevance_answered, relevance_feedback,
		pronunciation_score, fluency_score, overall_score
	) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := r.db.Exec(ctx, query,
		uuid.New(), userID, itemID, nullable(transcript), nullable(relevanceAnswered), nullable(relevanceFeedback),
		pronunciationScore, fluencyScore, overallScore,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to log assessment submission item")
	}
	return nil
}
