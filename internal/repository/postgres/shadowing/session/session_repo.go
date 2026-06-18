package postgressession

import (
	"context"

	"shadowing-backend/internal/domain/shadowing/session"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ============================================
// Create - ایجاد جلسه جدید
// ============================================
func (r DB) Create(ctx context.Context, s *session.Session) error {
	const op = "postgres.SessionRepository.Create"

	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to begin transaction")
	}
	defer tx.Rollback(ctx)

	// 1️⃣ ذخیره Session
	query := `INSERT INTO shadowing_sessions (
        id, user_id, scene_id, dialogue_id, status, current_step, total_steps, started_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err = tx.Exec(ctx, query,
		s.ID, s.UserID, s.SceneID, s.DialogueID,
		s.Status, s.CurrentStep, s.TotalSteps,
		s.StartedAt, s.UpdatedAt,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to insert session")
	}

	// 2️⃣ ذخیره Steps
	for _, step := range s.Steps {
		stepQuery := `INSERT INTO shadowing_steps (
            id, session_id, dialogue_id, step_type, status, display_text, translation, 
            audio_url, started_at, completed_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

		_, err = tx.Exec(ctx, stepQuery,
			step.ID, step.SessionID, step.DialogueID, step.StepType,
			step.Status, step.DisplayText, step.Translation, step.AudioURL,
			step.StartedAt, step.CompletedAt, step.CreatedAt, step.UpdatedAt,
		)
		if err != nil {
			return richerror.New(op).WithErr(err).WithMessage("failed to insert step")
		}
	}

	return tx.Commit(ctx)
}

// ============================================
// GetByID - دریافت جلسه با شناسه
// ============================================
func (r DB) GetByID(ctx context.Context, id uuid.UUID) (*session.Session, error) {
	const op = "postgres.SessionRepository.GetByID"

	// 1️⃣ دریافت Session
	sessionQuery := `SELECT 
        id, user_id, scene_id, dialogue_id, status, current_step, total_steps,
        started_at, completed_at, updated_at, created_at
    FROM shadowing_sessions WHERE id = $1`

	var s session.Session
	err := r.conn.QueryRow(ctx, sessionQuery, id).Scan(
		&s.ID, &s.UserID, &s.SceneID, &s.DialogueID,
		&s.Status, &s.CurrentStep, &s.TotalSteps,
		&s.StartedAt, &s.CompletedAt, &s.UpdatedAt, &s.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, richerror.New(op).
				WithMessage("session not found").
				WithKind(richerror.KindNotFound)
		}
		return nil, richerror.New(op).WithErr(err)
	}

	// 2️⃣ دریافت Steps
	stepsQuery := `SELECT 
        id, session_id, dialogue_id, step_type, status, display_text, translation,
        audio_url, started_at, completed_at, created_at, updated_at
    FROM shadowing_steps WHERE session_id = $1 ORDER BY step_type`

	rows, err := r.conn.Query(ctx, stepsQuery, s.ID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var steps []session.Step
	for rows.Next() {
		var step session.Step
		err := rows.Scan(
			&step.ID, &step.SessionID, &step.DialogueID, &step.StepType,
			&step.Status, &step.DisplayText, &step.Translation, &step.AudioURL,
			&step.StartedAt, &step.CompletedAt, &step.CreatedAt, &step.UpdatedAt,
		)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		steps = append(steps, step)
	}

	s.Steps = steps
	return &s, nil
}

// ============================================
// GetByUserID - دریافت جلسات یک کاربر
// ============================================
func (r DB) GetByUserID(ctx context.Context, userID uuid.UUID) ([]session.Session, error) {
	const op = "postgres.SessionRepository.GetByUserID"

	query := `SELECT 
        id, user_id, scene_id, dialogue_id, status, current_step, total_steps,
        started_at, completed_at, updated_at, created_at
    FROM shadowing_sessions WHERE user_id = $1 ORDER BY created_at DESC`

	rows, err := r.conn.Query(ctx, query, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var sessions []session.Session
	for rows.Next() {
		var s session.Session
		err := rows.Scan(
			&s.ID, &s.UserID, &s.SceneID, &s.DialogueID,
			&s.Status, &s.CurrentStep, &s.TotalSteps,
			&s.StartedAt, &s.CompletedAt, &s.UpdatedAt, &s.CreatedAt,
		)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		// Steps را خالی می‌گذاریم (برای لیست، نیازی به جزئیات نیست)
		s.Steps = []session.Step{}
		sessions = append(sessions, s)
	}

	return sessions, nil
}

// ============================================
// GetActiveByUser - دریافت جلسات فعال یک کاربر
// ============================================
func (r DB) GetActiveByUser(ctx context.Context, userID uuid.UUID) ([]session.Session, error) {
	const op = "postgres.SessionRepository.GetActiveByUser"

	query := `SELECT 
        id, user_id, scene_id, dialogue_id, status, current_step, total_steps,
        started_at, completed_at, updated_at, created_at
    FROM shadowing_sessions 
    WHERE user_id = $1 AND status IN ('pending', 'in_progress')
    ORDER BY created_at DESC`

	rows, err := r.conn.Query(ctx, query, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var sessions []session.Session
	for rows.Next() {
		var s session.Session
		err := rows.Scan(
			&s.ID, &s.UserID, &s.SceneID, &s.DialogueID,
			&s.Status, &s.CurrentStep, &s.TotalSteps,
			&s.StartedAt, &s.CompletedAt, &s.UpdatedAt, &s.CreatedAt,
		)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		s.Steps = []session.Step{}
		sessions = append(sessions, s)
	}

	return sessions, nil
}

// ============================================
// GetByUserAndDialogue - دریافت جلسه کاربر برای یک دیالوگ
// ============================================
func (r DB) GetByUserAndDialogue(ctx context.Context, userID, dialogueID uuid.UUID) (*session.Session, error) {
	const op = "postgres.SessionRepository.GetByUserAndDialogue"

	query := `SELECT 
        id, user_id, scene_id, dialogue_id, status, current_step, total_steps,
        started_at, completed_at, updated_at, created_at
    FROM shadowing_sessions 
    WHERE user_id = $1 AND dialogue_id = $2
    ORDER BY created_at DESC LIMIT 1`

	var s session.Session
	err := r.conn.QueryRow(ctx, query, userID, dialogueID).Scan(
		&s.ID, &s.UserID, &s.SceneID, &s.DialogueID,
		&s.Status, &s.CurrentStep, &s.TotalSteps,
		&s.StartedAt, &s.CompletedAt, &s.UpdatedAt, &s.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // هیچ جلسه‌ای وجود ندارد (خطا نیست)
		}
		return nil, richerror.New(op).WithErr(err)
	}

	// دریافت Steps
	stepsQuery := `SELECT 
        id, session_id, dialogue_id, step_type, status, display_text, translation,
        audio_url, started_at, completed_at, created_at, updated_at
    FROM shadowing_steps WHERE session_id = $1 ORDER BY step_type`

	rows, err := r.conn.Query(ctx, stepsQuery, s.ID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var steps []session.Step
	for rows.Next() {
		var step session.Step
		err := rows.Scan(
			&step.ID, &step.SessionID, &step.DialogueID, &step.StepType,
			&step.Status, &step.DisplayText, &step.Translation, &step.AudioURL,
			&step.StartedAt, &step.CompletedAt, &step.CreatedAt, &step.UpdatedAt,
		)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		steps = append(steps, step)
	}

	s.Steps = steps
	return &s, nil
}

// ============================================
// Update - به‌روزرسانی جلسه
// ============================================
func (r DB) Update(ctx context.Context, s *session.Session) error {
	const op = "postgres.SessionRepository.Update"

	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to begin transaction")
	}
	defer tx.Rollback(ctx)

	// 1️⃣ به‌روزرسانی Session
	query := `UPDATE shadowing_sessions SET 
        status = $1,
        current_step = $2,
        completed_at = $3,
        updated_at = $4
    WHERE id = $5`

	result, err := tx.Exec(ctx, query,
		s.Status, s.CurrentStep, s.CompletedAt,
		s.UpdatedAt, s.ID,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to update session")
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return richerror.New(op).
			WithMessage("session not found").
			WithKind(richerror.KindNotFound)
	}

	// 2️⃣ به‌روزرسانی Steps
	for _, step := range s.Steps {
		stepQuery := `UPDATE shadowing_steps SET 
            status = $1,
            started_at = $2,
            completed_at = $3,
            updated_at = $4
        WHERE id = $5`

		_, err = tx.Exec(ctx, stepQuery,
			step.Status, step.StartedAt, step.CompletedAt,
			step.UpdatedAt, step.ID,
		)
		if err != nil {
			return richerror.New(op).WithErr(err).WithMessage("failed to update step")
		}
	}

	return tx.Commit(ctx)
}

// ============================================
// Delete - حذف جلسه
// ============================================
func (r DB) Delete(ctx context.Context, id uuid.UUID) error {
	const op = "postgres.SessionRepository.Delete"

	query := `DELETE FROM shadowing_sessions WHERE id = $1`
	result, err := r.conn.Exec(ctx, query, id)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to delete session")
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return richerror.New(op).
			WithMessage("session not found").
			WithKind(richerror.KindNotFound)
	}

	return nil
}
