package postgressubmission

import (
	"context"
	"encoding/json"

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

type DialogueLine struct {
	Speaker string `json:"speaker"`
	Text    string `json:"text"`
}

type Submission struct {
	ID            string         `json:"id"`
	UserID        string         `json:"user_id"`
	ImageURL      string         `json:"image_url"`
	SituationText string         `json:"situation_text"`
	Dialogues     []DialogueLine `json:"dialogues"`
	Status        string         `json:"status"`
	AdminNote     string         `json:"admin_note"`
	PointsAwarded *int           `json:"points_awarded"`
	SceneID       string         `json:"scene_id"`
	ReviewedBy    string         `json:"reviewed_by"`
	ReviewedAt    string         `json:"reviewed_at"`
	CreatedAt     string         `json:"created_at"`
}

const selectColumns = `
	id::text, user_id::text, coalesce(image_url, ''), situation_text, dialogue_json, status,
	coalesce(admin_note, ''), points_awarded, coalesce(scene_id::text, ''),
	coalesce(reviewed_by::text, ''), coalesce(reviewed_at::text, ''), created_at::text
`

func scanSubmission(row pgx.Row) (Submission, error) {
	var s Submission
	var dialogueRaw []byte
	err := row.Scan(
		&s.ID, &s.UserID, &s.ImageURL, &s.SituationText, &dialogueRaw, &s.Status,
		&s.AdminNote, &s.PointsAwarded, &s.SceneID,
		&s.ReviewedBy, &s.ReviewedAt, &s.CreatedAt,
	)
	if err != nil {
		return Submission{}, err
	}
	if len(dialogueRaw) > 0 {
		_ = json.Unmarshal(dialogueRaw, &s.Dialogues)
	}
	return s, nil
}

// Create یک پیشنهاد صحنه‌ی جدید از کاربر ثبت می‌کند (وضعیت اولیه: در انتظار بررسی).
func (r DB) Create(ctx context.Context, userID, imageURL, situationText string, dialogues []DialogueLine) (Submission, error) {
	const op = "postgressubmission.Create"

	dialogueJSON, err := json.Marshal(dialogues)
	if err != nil {
		return Submission{}, richerror.New(op).WithErr(err).WithMessage("خطا در پردازش دیالوگ‌ها")
	}

	query := `
		INSERT INTO scene_submissions (user_id, image_url, situation_text, dialogue_json)
		VALUES ($1, NULLIF($2, ''), $3, $4)
		RETURNING ` + selectColumns

	row := r.conn.QueryRow(ctx, query, userID, imageURL, situationText, dialogueJSON)
	s, err := scanSubmission(row)
	if err != nil {
		return Submission{}, richerror.New(op).WithErr(err).WithMessage("خطا در ثبت پیشنهاد صحنه")
	}
	return s, nil
}

// ListByUser پیشنهادهای یک کاربر خاص را برمی‌گرداند (جدیدترین اول).
func (r DB) ListByUser(ctx context.Context, userID string) ([]Submission, error) {
	const op = "postgressubmission.ListByUser"

	query := `SELECT ` + selectColumns + ` FROM scene_submissions WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := r.conn.Query(ctx, query, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پیشنهادهای کاربر")
	}
	defer rows.Close()
	return scanSubmissionRows(rows)
}

// ListByStatus پیشنهادها را بر اساس وضعیت فیلتر می‌کند (مثلاً برای صف بررسی ادمین).
func (r DB) ListByStatus(ctx context.Context, status string) ([]Submission, error) {
	const op = "postgressubmission.ListByStatus"

	var query string
	var rows pgx.Rows
	var err error
	if status == "" {
		query = `SELECT ` + selectColumns + ` FROM scene_submissions ORDER BY created_at DESC`
		rows, err = r.conn.Query(ctx, query)
	} else {
		query = `SELECT ` + selectColumns + ` FROM scene_submissions WHERE status = $1 ORDER BY created_at DESC`
		rows, err = r.conn.Query(ctx, query, status)
	}
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن لیست پیشنهادها")
	}
	defer rows.Close()
	return scanSubmissionRows(rows)
}

func scanSubmissionRows(rows pgx.Rows) ([]Submission, error) {
	var list []Submission
	for rows.Next() {
		s, err := scanSubmission(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

// Get یک پیشنهاد را با شناسه برمی‌گرداند.
func (r DB) Get(ctx context.Context, id string) (Submission, error) {
	const op = "postgressubmission.Get"

	query := `SELECT ` + selectColumns + ` FROM scene_submissions WHERE id = $1`
	row := r.conn.QueryRow(ctx, query, id)
	s, err := scanSubmission(row)
	if err != nil {
		return Submission{}, richerror.New(op).WithErr(err).WithMessage("پیشنهاد مورد نظر پیدا نشد")
	}
	return s, nil
}

// MarkApproved پیشنهاد را تاییدشده علامت می‌زند، به صحنه‌ی ساخته‌شده وصل می‌کند و
// امتیاز اهدایی را ثبت می‌کند.
func (r DB) MarkApproved(ctx context.Context, id, sceneID, reviewerID string, points int) error {
	const op = "postgressubmission.MarkApproved"

	const query = `
		UPDATE scene_submissions
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
	const op = "postgressubmission.MarkRejected"

	const query = `
		UPDATE scene_submissions
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
func (r DB) AwardPoints(ctx context.Context, userID string, delta int, reason, submissionID string) error {
	const op = "postgressubmission.AwardPoints"

	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx,
		`INSERT INTO point_transactions (user_id, delta, reason, submission_id) VALUES ($1, $2, $3, NULLIF($4, '')::uuid)`,
		userID, delta, reason, submissionID,
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

// UserPoints موجودی امتیاز فعلی یک کاربر را برمی‌گرداند.
func (r DB) UserPoints(ctx context.Context, userID string) (int, error) {
	const op = "postgressubmission.UserPoints"

	var points int
	err := r.conn.QueryRow(ctx, `SELECT points FROM users WHERE id = $1`, userID).Scan(&points)
	if err != nil {
		return 0, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن موجودی امتیاز")
	}
	return points, nil
}
