package posttopicsuggestion

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

type TopicSuggestion struct {
	ID            string `json:"id"`
	UserID        string `json:"user_id"`
	TopicText     string `json:"topic_text"`
	Status        string `json:"status"`
	AdminNote     string `json:"admin_note"`
	PointsAwarded *int   `json:"points_awarded"`
	SceneID       string `json:"scene_id"`
	ReviewedBy    string `json:"reviewed_by"`
	ReviewedAt    string `json:"reviewed_at"`
	CreatedAt     string `json:"created_at"`
}

const selectColumns = `
	id::text, user_id::text, topic_text, status, coalesce(admin_note, ''), points_awarded,
	coalesce(scene_id::text, ''), coalesce(reviewed_by::text, ''), coalesce(reviewed_at::text, ''), created_at::text
`

func scanTopicSuggestion(row pgx.Row) (TopicSuggestion, error) {
	var t TopicSuggestion
	err := row.Scan(
		&t.ID, &t.UserID, &t.TopicText, &t.Status, &t.AdminNote, &t.PointsAwarded,
		&t.SceneID, &t.ReviewedBy, &t.ReviewedAt, &t.CreatedAt,
	)
	return t, err
}

// Create یک پیشنهاد موضوع جدید از کاربر ثبت می‌کند (وضعیت اولیه: در انتظار بررسی).
func (r DB) Create(ctx context.Context, userID, topicText string) (TopicSuggestion, error) {
	const op = "posttopicsuggestion.Create"

	query := `INSERT INTO topic_suggestions (user_id, topic_text) VALUES ($1, $2) RETURNING ` + selectColumns

	row := r.conn.QueryRow(ctx, query, userID, topicText)
	t, err := scanTopicSuggestion(row)
	if err != nil {
		return TopicSuggestion{}, richerror.New(op).WithErr(err).WithMessage("خطا در ثبت پیشنهاد موضوع")
	}
	return t, nil
}

// ListByUser پیشنهادهای موضوع یک کاربر خاص را برمی‌گرداند (جدیدترین اول).
func (r DB) ListByUser(ctx context.Context, userID string) ([]TopicSuggestion, error) {
	const op = "posttopicsuggestion.ListByUser"

	query := `SELECT ` + selectColumns + ` FROM topic_suggestions WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := r.conn.Query(ctx, query, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پیشنهادهای کاربر")
	}
	defer rows.Close()
	return scanTopicSuggestionRows(rows)
}

// ListByStatus پیشنهادها را بر اساس وضعیت فیلتر می‌کند (مثلاً برای صف بررسی ادمین).
func (r DB) ListByStatus(ctx context.Context, status string) ([]TopicSuggestion, error) {
	const op = "posttopicsuggestion.ListByStatus"

	var query string
	var rows pgx.Rows
	var err error
	if status == "" {
		query = `SELECT ` + selectColumns + ` FROM topic_suggestions ORDER BY created_at DESC`
		rows, err = r.conn.Query(ctx, query)
	} else {
		query = `SELECT ` + selectColumns + ` FROM topic_suggestions WHERE status = $1 ORDER BY created_at DESC`
		rows, err = r.conn.Query(ctx, query, status)
	}
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن لیست پیشنهادها")
	}
	defer rows.Close()
	return scanTopicSuggestionRows(rows)
}

func scanTopicSuggestionRows(rows pgx.Rows) ([]TopicSuggestion, error) {
	var list []TopicSuggestion
	for rows.Next() {
		t, err := scanTopicSuggestion(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, nil
}

// Get یک پیشنهاد را با شناسه برمی‌گرداند.
func (r DB) Get(ctx context.Context, id string) (TopicSuggestion, error) {
	const op = "posttopicsuggestion.Get"

	query := `SELECT ` + selectColumns + ` FROM topic_suggestions WHERE id = $1`
	row := r.conn.QueryRow(ctx, query, id)
	t, err := scanTopicSuggestion(row)
	if err != nil {
		return TopicSuggestion{}, richerror.New(op).WithErr(err).WithMessage("پیشنهاد مورد نظر پیدا نشد")
	}
	return t, nil
}

// MarkApproved پیشنهاد را تاییدشده علامت می‌زند، به صحنه‌ی ساخته‌شده وصل می‌کند و
// امتیاز اهدایی را ثبت می‌کند.
func (r DB) MarkApproved(ctx context.Context, id, sceneID, reviewerID string, points int) error {
	const op = "posttopicsuggestion.MarkApproved"

	const query = `
		UPDATE topic_suggestions
		SET status = 'approved', scene_id = $2, reviewed_by = $3, reviewed_at = now(), points_awarded = $4
		WHERE id = $1
	`
	_, err := r.conn.Exec(ctx, query, id, sceneID, reviewerID, points)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در تایید پیشنهاد")
	}
	return nil
}

// MarkRejected پیشنهاد را ردشده علامت می‌زند (بدون اهدای امتیاز).
func (r DB) MarkRejected(ctx context.Context, id, reviewerID, note string) error {
	const op = "posttopicsuggestion.MarkRejected"

	const query = `
		UPDATE topic_suggestions
		SET status = 'rejected', reviewed_by = $2, reviewed_at = now(), admin_note = $3
		WHERE id = $1
	`
	_, err := r.conn.Exec(ctx, query, id, reviewerID, note)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در رد پیشنهاد")
	}
	return nil
}

// AwardPoints یک تراکنش امتیاز برای کاربر ثبت و موجودی او را به‌روزرسانی می‌کند.
func (r DB) AwardPoints(ctx context.Context, userID string, delta int, reason string) error {
	const op = "posttopicsuggestion.AwardPoints"

	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx,
		`INSERT INTO point_transactions (user_id, delta, reason) VALUES ($1, $2, $3)`,
		userID, delta, reason,
	); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ثبت تراکنش امتیاز")
	}

	if _, err := tx.Exec(ctx, `UPDATE users SET points = points + $2 WHERE id = $1`, userID, delta); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در به‌روزرسانی موجودی امتیاز")
	}

	if err := tx.Commit(ctx); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}
