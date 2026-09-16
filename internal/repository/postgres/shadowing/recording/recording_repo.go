package postgresrecording

import (
	"context"
	"encoding/json"
	"shadowing-backend/internal/domain/shadowing/recording"
	"shadowing-backend/internal/pkg/richerror"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// WeekTrend - میانگین امتیاز گفتاری کاربر (میانگین تلفظ/روانی گفتار) در یک
// هفته‌ی تقویمی، برای نمودار «پیشرفت در طول زمان».
type WeekTrend struct {
	WeekStart string
	Speaking  int
	Sessions  int
}

// ============================================
// AvgScoresByUser - میانگین نمره‌ی تلفظ/روانی گفتار کاربر از روی هر دو منبع
// نمره‌ی واقعی‌اش: ضبط‌های جلسه‌محورِ قدیمی (shadowing_recordings) و
// رویدادهای نمره‌دهیِ session-less مسیر واقعی اپ (shadowing_evaluation_events)
// (برای «درصد مهارت‌ها»)
// ============================================
func (r DB) AvgScoresByUser(ctx context.Context, userID uuid.UUID) (avgPronunciation, avgFluency float64, err error) {
	const op = "postgres.RecordingRepository.AvgScoresByUser"

	query := `
        SELECT COALESCE(AVG(pronunciation_score), 0), COALESCE(AVG(fluency_score), 0)
        FROM (
            SELECT pronunciation_score, fluency_score FROM shadowing_recordings WHERE user_id = $1
            UNION ALL
            SELECT pronunciation_score, fluency_score FROM shadowing_evaluation_events WHERE user_id = $1
        ) scores`

	if err := r.conn.QueryRow(ctx, query, userID).Scan(&avgPronunciation, &avgFluency); err != nil {
		return 0, 0, richerror.New(op).WithErr(err)
	}
	return avgPronunciation, avgFluency, nil
}

// ============================================
// TrendByUser - میانگین امتیاز گفتاری کاربر به‌ازای هر هفته از ۶ هفته‌ی اخیر
// (شامل هفته‌ی جاری)، برای نمودار «پیشرفت در طول زمان». مثل WeeklyActivity،
// هفته‌های بدون فعالیت هم با صفر برمی‌گردند تا محور هفته‌ها پیوسته بماند؛
// فرانت با استفاده از Sessions تشخیص می‌دهد کدام هفته واقعاً داده دارد.
// ============================================
func (r DB) TrendByUser(ctx context.Context, userID uuid.UUID) ([]WeekTrend, error) {
	const op = "postgres.RecordingRepository.TrendByUser"

	query := `
        WITH weeks AS (
            SELECT generate_series(
                date_trunc('week', current_date) - interval '5 weeks',
                date_trunc('week', current_date),
                interval '1 week'
            )::date AS week_start
        ),
        scores AS (
            SELECT date_trunc('week', created_at)::date AS week_start, pronunciation_score, fluency_score
            FROM shadowing_recordings
            WHERE user_id = $1 AND created_at >= date_trunc('week', current_date) - interval '5 weeks'
            UNION ALL
            SELECT date_trunc('week', created_at)::date AS week_start, pronunciation_score, fluency_score
            FROM shadowing_evaluation_events
            WHERE user_id = $1 AND created_at >= date_trunc('week', current_date) - interval '5 weeks'
        )
        SELECT weeks.week_start,
               COALESCE(AVG((scores.pronunciation_score + scores.fluency_score) / 2), 0),
               COUNT(scores.pronunciation_score)
        FROM weeks
        LEFT JOIN scores ON scores.week_start = weeks.week_start
        GROUP BY weeks.week_start
        ORDER BY weeks.week_start`

	rows, err := r.conn.Query(ctx, query, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var result []WeekTrend
	for rows.Next() {
		var weekStart time.Time
		var avgSpeaking float64
		var sessions int
		if err := rows.Scan(&weekStart, &avgSpeaking, &sessions); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		result = append(result, WeekTrend{
			WeekStart: weekStart.Format("2006-01-02"),
			Speaking:  int(avgSpeaking),
			Sessions:  sessions,
		})
	}

	return result, nil
}

// ============================================
// CreateEvaluationEvent - ثبت یک نمره‌دهی session-less (مسیر واقعی اپ)
// ============================================
func (r DB) CreateEvaluationEvent(ctx context.Context, userID uuid.UUID, dialogueID *uuid.UUID, pronunciationScore, fluencyScore float64, durationSeconds int) error {
	const op = "postgres.RecordingRepository.CreateEvaluationEvent"

	const query = `
        INSERT INTO shadowing_evaluation_events
            (user_id, dialogue_id, pronunciation_score, fluency_score, duration_seconds)
        VALUES ($1, $2, $3, $4, $5)
    `
	if _, err := r.conn.Exec(ctx, query, userID, dialogueID, pronunciationScore, fluencyScore, durationSeconds); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to save evaluation event")
	}
	return nil
}

// ============================================
// Create - ذخیره ضبط جدید
// ============================================
func (r DB) Create(ctx context.Context, rec *recording.Recording) error {
	const op = "postgres.RecordingRepository.Create"

	query := `INSERT INTO shadowing_recordings (
        id, user_id, session_id, dialogue_id, step_type, recording_type, audio_path, duration, pronunciation_score, fluency_score, overall_score, transcript, word_scores, is_estimated, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`

	// نمره‌ی کلمه‌ها صریحاً به JSON تبدیل می‌شود؛ به کدک خودکار pgx تکیه
	// نمی‌کنیم تا اگر روزی نوع ستون عوض شد، خطا در همین‌جا معلوم شود.
	wordScoresJSON, err := json.Marshal(rec.WordScores)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to encode word scores")
	}

	_, err = r.conn.Exec(ctx, query,
		rec.ID, rec.UserID, rec.SessionID, rec.DialogueID,
		rec.StepType, rec.RecordingType, rec.AudioPath, rec.Duration,
		rec.PronunciationScore, rec.FluencyScore, rec.OverallScore,
		rec.Transcript, wordScoresJSON, rec.IsEstimated, rec.CreatedAt,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to save recording")
	}

	return nil
}

// ============================================
// GetByID - دریافت ضبط با شناسه
// ============================================
func (r DB) GetByID(ctx context.Context, id uuid.UUID) (*recording.Recording, error) {
	const op = "postgres.RecordingRepository.GetByID"

	query := `SELECT 
        id, user_id, session_id, dialogue_id, step_type, recording_type, audio_path, duration, pronunciation_score, fluency_score, overall_score, transcript, word_scores, is_estimated, created_at
    FROM shadowing_recordings WHERE id = $1`

	var rec recording.Recording
	err := r.conn.QueryRow(ctx, query, id).Scan(
		&rec.ID, &rec.UserID, &rec.SessionID, &rec.DialogueID,
		&rec.StepType, &rec.RecordingType, &rec.AudioPath,
		&rec.Duration, &rec.PronunciationScore, &rec.FluencyScore, &rec.OverallScore,
		&rec.Transcript, &rec.WordScores, &rec.IsEstimated, &rec.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, richerror.New(op).
				WithMessage("recording not found").
				WithKind(richerror.KindNotFound)
		}
		return nil, richerror.New(op).WithErr(err)
	}

	return &rec, nil
}

// ============================================
// GetBySessionID - دریافت ضبط‌های یک جلسه
// ============================================
func (r DB) GetBySessionID(ctx context.Context, sessionID uuid.UUID) ([]recording.Recording, error) {
	const op = "postgres.RecordingRepository.GetBySessionID"

	query := `SELECT 
        id, user_id, session_id, dialogue_id, step_type, recording_type, audio_path, duration, pronunciation_score, fluency_score, overall_score, transcript, word_scores, is_estimated, created_at
    FROM shadowing_recordings WHERE session_id = $1 ORDER BY created_at DESC`

	rows, err := r.conn.Query(ctx, query, sessionID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var recordings []recording.Recording
	for rows.Next() {
		var rec recording.Recording
		err := rows.Scan(
			&rec.ID, &rec.UserID, &rec.SessionID, &rec.DialogueID,
			&rec.StepType, &rec.RecordingType, &rec.AudioPath,
			&rec.Duration, &rec.PronunciationScore, &rec.FluencyScore, &rec.OverallScore,
			&rec.Transcript, &rec.WordScores, &rec.IsEstimated, &rec.CreatedAt,
		)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		recordings = append(recordings, rec)
	}

	return recordings, nil
}

// ============================================
// GetByUserAndDialogue - دریافت ضبط‌های کاربر برای یک دیالوگ
// ============================================
func (r DB) GetByUserAndDialogue(ctx context.Context, userID, dialogueID uuid.UUID) ([]recording.Recording, error) {
	const op = "postgres.RecordingRepository.GetByUserAndDialogue"

	query := `SELECT 
        id, user_id, session_id, dialogue_id, step_type, recording_type, audio_path, duration, pronunciation_score, fluency_score, overall_score, transcript, word_scores, is_estimated, created_at
    FROM shadowing_recordings 
    WHERE user_id = $1 AND dialogue_id = $2
    ORDER BY created_at DESC`

	rows, err := r.conn.Query(ctx, query, userID, dialogueID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var recordings []recording.Recording
	for rows.Next() {
		var rec recording.Recording
		err := rows.Scan(
			&rec.ID, &rec.UserID, &rec.SessionID, &rec.DialogueID,
			&rec.StepType, &rec.RecordingType, &rec.AudioPath,
			&rec.Duration, &rec.PronunciationScore, &rec.FluencyScore, &rec.OverallScore,
			&rec.Transcript, &rec.WordScores, &rec.IsEstimated, &rec.CreatedAt,
		)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		recordings = append(recordings, rec)
	}

	return recordings, nil
}

// ============================================
// Delete - حذف ضبط
// ============================================
func (r DB) Delete(ctx context.Context, id uuid.UUID) error {
	const op = "postgres.RecordingRepository.Delete"

	query := `DELETE FROM shadowing_recordings WHERE id = $1`
	result, err := r.conn.Exec(ctx, query, id)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to delete recording")
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return richerror.New(op).
			WithMessage("recording not found").
			WithKind(richerror.KindNotFound)
	}

	return nil
}

// ============================================
// DeleteBySession - حذف همه ضبط‌های یک جلسه
// ============================================
func (r DB) DeleteBySession(ctx context.Context, sessionID uuid.UUID) error {
	const op = "postgres.RecordingRepository.DeleteBySession"

	query := `DELETE FROM shadowing_recordings WHERE session_id = $1`
	_, err := r.conn.Exec(ctx, query, sessionID)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to delete session recordings")
	}

	return nil
}
