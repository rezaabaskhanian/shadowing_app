package postgresassessment

import (
	"context"

	"shadowing-backend/internal/domain/assessment"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProfileRepository struct {
	db *pgxpool.Pool
}

func NewProfileRepository(db *pgxpool.Pool) *ProfileRepository {
	return &ProfileRepository{db: db}
}

// Upsert - ثبت/به‌روزرسانی پروفایل گفتاری کاربر. نسخه‌بندی نداریم؛ هر تست
// جدید نتیجه‌ی قبلی را جایگزین می‌کند.
func (r *ProfileRepository) Upsert(ctx context.Context, p *assessment.SpeakingProfile) error {
	const op = "postgresassessment.ProfileRepository.Upsert"

	query := `INSERT INTO speaking_profiles (
		id, user_id, level, overall_score, pronunciation_score, fluency_score, is_estimated, assessed_at, created_at, updated_at
	) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	ON CONFLICT (user_id) DO UPDATE SET
		level = EXCLUDED.level,
		overall_score = EXCLUDED.overall_score,
		pronunciation_score = EXCLUDED.pronunciation_score,
		fluency_score = EXCLUDED.fluency_score,
		is_estimated = EXCLUDED.is_estimated,
		assessed_at = EXCLUDED.assessed_at,
		updated_at = EXCLUDED.updated_at`

	_, err := r.db.Exec(ctx, query,
		p.ID, p.UserID, p.Level, p.OverallScore, p.PronunciationScore, p.FluencyScore,
		p.IsEstimated, p.AssessedAt, p.CreatedAt, p.UpdatedAt,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to save speaking profile")
	}
	return nil
}

// GetByUser - پروفایل گفتاری کاربر؛ نبودش یعنی کاربر هنوز تست نداده (نه خطا).
func (r *ProfileRepository) GetByUser(ctx context.Context, userID uuid.UUID) (*assessment.SpeakingProfile, error) {
	const op = "postgresassessment.ProfileRepository.GetByUser"

	query := `SELECT id, user_id, level, overall_score, pronunciation_score, fluency_score, is_estimated, assessed_at, created_at, updated_at
	FROM speaking_profiles WHERE user_id = $1`

	var p assessment.SpeakingProfile
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&p.ID, &p.UserID, &p.Level, &p.OverallScore, &p.PronunciationScore, &p.FluencyScore,
		&p.IsEstimated, &p.AssessedAt, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, richerror.New(op).WithMessage("speaking profile not found").WithKind(richerror.KindNotFound)
		}
		return nil, richerror.New(op).WithErr(err)
	}
	return &p, nil
}
