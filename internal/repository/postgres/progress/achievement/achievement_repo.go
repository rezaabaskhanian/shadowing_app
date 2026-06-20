package postgresachievement

import (
	"context"
	"shadowing-backend/internal/domain/progress/achievement"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AchievementRepository struct {
	db *pgxpool.Pool
}

func NewAchievementRepository(db *pgxpool.Pool) *AchievementRepository {
	return &AchievementRepository{db: db}
}

// ============================================
// GetByUser - دریافت دستاوردهای کاربر
// ============================================
func (r *AchievementRepository) GetByUser(ctx context.Context, userID uuid.UUID) ([]achievement.Achievement, error) {
	const op = "postgres.AchievementRepository.GetByUser"

	query := `SELECT 
        id, user_id, type, rarity, name, description, icon, xp, unlocked_at, created_at
    FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var achievements []achievement.Achievement
	for rows.Next() {
		var a achievement.Achievement
		err := rows.Scan(
			&a.ID, &a.UserID, &a.Type, &a.Rarity,
			&a.Name, &a.Description, &a.Icon, &a.XP,
			&a.UnlockedAt, &a.CreatedAt,
		)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		achievements = append(achievements, a)
	}

	return achievements, nil
}

// ============================================
// Create - ایجاد دستاورد جدید
// ============================================
func (r *AchievementRepository) Create(ctx context.Context, a *achievement.Achievement) error {
	const op = "postgres.AchievementRepository.Create"

	query := `INSERT INTO achievements (
        id, user_id, type, rarity, name, description, icon, xp, unlocked_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err := r.db.Exec(ctx, query,
		a.ID, a.UserID, a.Type, a.Rarity,
		a.Name, a.Description, a.Icon, a.XP,
		a.UnlockedAt, a.CreatedAt,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to create achievement")
	}

	return nil
}

// ============================================
// Exists - بررسی وجود دستاورد
// ============================================
func (r *AchievementRepository) Exists(ctx context.Context, userID uuid.UUID, achType achievement.AchievementType) (bool, error) {
	const op = "postgres.AchievementRepository.Exists"

	query := `SELECT EXISTS(SELECT 1 FROM achievements WHERE user_id = $1 AND type = $2)`

	var exists bool
	err := r.db.QueryRow(ctx, query, userID, achType).Scan(&exists)
	if err != nil {
		return false, richerror.New(op).WithErr(err)
	}

	return exists, nil
}
