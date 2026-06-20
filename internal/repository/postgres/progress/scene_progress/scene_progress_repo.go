package postgresssceneprogress

import (
	"context"
	sceneprogress "shadowing-backend/internal/domain/progress/scene_progress"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SceneProgressRepository struct {
	db *pgxpool.Pool
}

func NewSceneProgressRepository(db *pgxpool.Pool) *SceneProgressRepository {
	return &SceneProgressRepository{db: db}
}

// ============================================
// Create - ایجاد پیشرفت جدید
// ============================================
func (r *SceneProgressRepository) Create(ctx context.Context, p *sceneprogress.SceneProgress) error {
	const op = "postgres.SceneProgressRepository.Create"

	query := `INSERT INTO scene_progress (
        id, user_id, scene_id, progress_percentage, completed_dialogues,
        total_dialogues, score, xp, is_completed, last_accessed_at,
        completed_at, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`

	_, err := r.db.Exec(ctx, query,
		p.ID, p.UserID, p.SceneID, p.ProgressPercentage,
		p.CompletedDialogues, p.TotalDialogues, p.Score, p.XP,
		p.IsCompleted, p.LastAccessedAt, p.CompletedAt,
		p.CreatedAt, p.UpdatedAt,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to create scene progress")
	}

	return nil
}

// ============================================
// GetByUserAndScene - دریافت پیشرفت کاربر در یک سناریو
// ============================================
func (r *SceneProgressRepository) GetByUserAndScene(ctx context.Context, userID, sceneID string) (*sceneprogress.SceneProgress, error) {
	const op = "postgres.SceneProgressRepository.GetByUserAndScene"

	query := `SELECT 
        id, user_id, scene_id, progress_percentage, completed_dialogues,
        total_dialogues, score, xp, is_completed, last_accessed_at,
        completed_at, created_at, updated_at
    FROM scene_progress WHERE user_id = $1 AND scene_id = $2`

	var p sceneprogress.SceneProgress
	err := r.db.QueryRow(ctx, query, userID, sceneID).Scan(
		&p.ID, &p.UserID, &p.SceneID, &p.ProgressPercentage,
		&p.CompletedDialogues, &p.TotalDialogues, &p.Score, &p.XP,
		&p.IsCompleted, &p.LastAccessedAt, &p.CompletedAt,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, richerror.New(op).
				WithMessage("scene progress not found").
				WithKind(richerror.KindNotFound)
		}
		return nil, richerror.New(op).WithErr(err)
	}

	return &p, nil
}

// ============================================
// GetByUser - دریافت همه پیشرفت‌های یک کاربر
// ============================================
func (r *SceneProgressRepository) GetByUser(ctx context.Context, userID string) ([]sceneprogress.SceneProgress, error) {
	const op = "postgres.SceneProgressRepository.GetByUser"

	query := `SELECT 
        id, user_id, scene_id, progress_percentage, completed_dialogues,
        total_dialogues, score, xp, is_completed, last_accessed_at,
        completed_at, created_at, updated_at
    FROM scene_progress WHERE user_id = $1 ORDER BY updated_at DESC`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var progresses []sceneprogress.SceneProgress
	for rows.Next() {
		var p sceneprogress.SceneProgress
		err := rows.Scan(
			&p.ID, &p.UserID, &p.SceneID, &p.ProgressPercentage,
			&p.CompletedDialogues, &p.TotalDialogues, &p.Score, &p.XP,
			&p.IsCompleted, &p.LastAccessedAt, &p.CompletedAt,
			&p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		progresses = append(progresses, p)
	}

	return progresses, nil
}

// ============================================
// Update - به‌روزرسانی پیشرفت
// ============================================
func (r *SceneProgressRepository) Update(ctx context.Context, p *sceneprogress.SceneProgress) error {
	const op = "postgres.SceneProgressRepository.Update"

	query := `UPDATE scene_progress SET 
        progress_percentage = $1,
        completed_dialogues = $2,
        score = $3,
        xp = $4,
        is_completed = $5,
        last_accessed_at = $6,
        completed_at = $7,
        updated_at = $8
    WHERE id = $9`

	result, err := r.db.Exec(ctx, query,
		p.ProgressPercentage, p.CompletedDialogues, p.Score, p.XP,
		p.IsCompleted, p.LastAccessedAt, p.CompletedAt,
		p.UpdatedAt, p.ID,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to update scene progress")
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return richerror.New(op).
			WithMessage("scene progress not found").
			WithKind(richerror.KindNotFound)
	}

	return nil
}

// ============================================
// GetCompletedScenes - دریافت سناریوهای تکمیل‌شده کاربر
// ============================================
func (r *SceneProgressRepository) GetCompletedScenes(ctx context.Context, userID string) ([]sceneprogress.SceneProgress, error) {
	const op = "postgres.SceneProgressRepository.GetCompletedScenes"

	query := `SELECT 
        id, user_id, scene_id, progress_percentage, completed_dialogues,
        total_dialogues, score, xp, is_completed, last_accessed_at,
        completed_at, created_at, updated_at
    FROM scene_progress 
    WHERE user_id = $1 AND is_completed = true
    ORDER BY completed_at DESC`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var progresses []sceneprogress.SceneProgress
	for rows.Next() {
		var p sceneprogress.SceneProgress
		err := rows.Scan(
			&p.ID, &p.UserID, &p.SceneID, &p.ProgressPercentage,
			&p.CompletedDialogues, &p.TotalDialogues, &p.Score, &p.XP,
			&p.IsCompleted, &p.LastAccessedAt, &p.CompletedAt,
			&p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		progresses = append(progresses, p)
	}

	return progresses, nil
}
