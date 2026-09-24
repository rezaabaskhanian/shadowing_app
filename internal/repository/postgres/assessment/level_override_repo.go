package postgresassessment

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// LevelOverrideRepository سطحِ انتخاب‌شده‌ی دستی کاربر (جدول user_level_overrides).
type LevelOverrideRepository struct {
	db *pgxpool.Pool
}

func NewLevelOverrideRepository(db *pgxpool.Pool) *LevelOverrideRepository {
	return &LevelOverrideRepository{db: db}
}

// Get سطح دستی کاربر را برمی‌گرداند؛ رشته‌ی خالی یعنی دستی چیزی انتخاب نکرده.
func (r *LevelOverrideRepository) Get(ctx context.Context, userID uuid.UUID) (string, error) {
	const op = "postgresassessment.LevelOverrideRepository.Get"

	var difficulty string
	err := r.db.QueryRow(ctx, `SELECT difficulty FROM user_level_overrides WHERE user_id = $1`, userID).Scan(&difficulty)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", nil
		}
		return "", richerror.New(op).WithErr(err)
	}
	return difficulty, nil
}

func (r *LevelOverrideRepository) Set(ctx context.Context, userID uuid.UUID, difficulty string) error {
	const op = "postgresassessment.LevelOverrideRepository.Set"

	_, err := r.db.Exec(ctx, `
		INSERT INTO user_level_overrides (user_id, difficulty, updated_at) VALUES ($1, $2, now())
		ON CONFLICT (user_id) DO UPDATE SET difficulty = EXCLUDED.difficulty, updated_at = now()
	`, userID, difficulty)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to save level")
	}
	return nil
}

func (r *LevelOverrideRepository) Clear(ctx context.Context, userID uuid.UUID) error {
	const op = "postgresassessment.LevelOverrideRepository.Clear"

	if _, err := r.db.Exec(ctx, `DELETE FROM user_level_overrides WHERE user_id = $1`, userID); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}
