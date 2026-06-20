package postgressstreak

import (
	"context"
	"shadowing-backend/internal/domain/progress/streak"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StreakRepository struct {
	db *pgxpool.Pool
}

func NewStreakRepository(db *pgxpool.Pool) *StreakRepository {
	return &StreakRepository{db: db}
}

// ============================================
// GetByUser - دریافت استریک کاربر
// ============================================
func (r *StreakRepository) GetByUser(ctx context.Context, userID uuid.UUID) (*streak.Streak, error) {
	const op = "postgres.StreakRepository.GetByUser"

	query := `SELECT 
        id, user_id, current, longest, last_date, status, freezes, created_at, updated_at
    FROM streaks WHERE user_id = $1`

	var s streak.Streak
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&s.ID, &s.UserID, &s.Current, &s.Longest,
		&s.LastDate, &s.Status, &s.Freezes,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, richerror.New(op).
				WithMessage("streak not found").
				WithKind(richerror.KindNotFound)
		}
		return nil, richerror.New(op).WithErr(err)
	}

	return &s, nil
}

// ============================================
// Create - ایجاد استریک جدید
// ============================================
func (r *StreakRepository) Create(ctx context.Context, s *streak.Streak) error {
	const op = "postgres.StreakRepository.Create"

	query := `INSERT INTO streaks (
        id, user_id, current, longest, last_date, status, freezes, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := r.db.Exec(ctx, query,
		s.ID, s.UserID, s.Current, s.Longest,
		s.LastDate, s.Status, s.Freezes,
		s.CreatedAt, s.UpdatedAt,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to create streak")
	}

	return nil
}

// ============================================
// Update - به‌روزرسانی استریک
// ============================================
func (r *StreakRepository) Update(ctx context.Context, s *streak.Streak) error {
	const op = "postgres.StreakRepository.Update"

	query := `UPDATE streaks SET 
        current = $1,
        longest = $2,
        last_date = $3,
        status = $4,
        freezes = $5,
        updated_at = $6
    WHERE id = $7`

	result, err := r.db.Exec(ctx, query,
		s.Current, s.Longest, s.LastDate,
		s.Status, s.Freezes, s.UpdatedAt, s.ID,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to update streak")
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return richerror.New(op).
			WithMessage("streak not found").
			WithKind(richerror.KindNotFound)
	}

	return nil
}
