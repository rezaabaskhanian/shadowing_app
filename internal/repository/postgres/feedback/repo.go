package postgresfeedback

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

// Feedback یک پیام «پیشنهاد یا انتقاد» ثبت‌شده توسط کاربر از طریق درج اپ موبایل است.
type Feedback struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	Message   string `json:"message"`
	CreatedAt string `json:"created_at"`

	// UserNickName/UserPhone فقط در ListAll برای نمایش در پنل ادمین پر می‌شوند.
	UserNickName string `json:"user_nickname,omitempty"`
	UserPhone    string `json:"user_phone,omitempty"`
	// LastReply آخرین جواب ادمین (از ربات یا پنل)؛ فقط در ListAll.
	LastReply string `json:"last_reply,omitempty"`
}

// Reply جواب ادمین به یکی از تعامل‌های کاربر (ببینید جدول support_replies).
type Reply struct {
	ID        string `json:"id"`
	UserID    string `json:"-"`
	Kind      string `json:"kind"`
	RefID     string `json:"ref_id"`
	Original  string `json:"original"`
	Reply     string `json:"reply"`
	CreatedAt string `json:"created_at"`
}

// Create یک پیام پیشنهاد/انتقاد جدید از کاربر ثبت می‌کند.
func (r DB) Create(ctx context.Context, userID, message string) (Feedback, error) {
	const op = "postgresfeedback.Create"

	query := `INSERT INTO feedbacks (user_id, message) VALUES ($1, $2)
		RETURNING id::text, user_id::text, message, created_at::text`

	var f Feedback
	err := r.conn.QueryRow(ctx, query, userID, message).Scan(&f.ID, &f.UserID, &f.Message, &f.CreatedAt)
	if err != nil {
		return Feedback{}, richerror.New(op).WithErr(err).WithMessage("خطا در ثبت پیام")
	}
	return f, nil
}

// ListAll همه‌ی پیام‌های پیشنهاد/انتقاد را همراه با اطلاعات کاربر برمی‌گرداند
// (جدیدترین اول) — برای صف بررسی پنل ادمین.
func (r DB) ListAll(ctx context.Context) ([]Feedback, error) {
	const op = "postgresfeedback.ListAll"

	query := `
		SELECT f.id::text, f.user_id::text, f.message, f.created_at::text,
			u.nickname, u.phone, COALESCE(r.reply, '')
		FROM feedbacks f
		JOIN users u ON u.id = f.user_id
		LEFT JOIN LATERAL (
			SELECT reply FROM support_replies
			WHERE kind = 'feedback' AND ref_id = f.id::text
			ORDER BY created_at DESC LIMIT 1
		) r ON true
		ORDER BY f.created_at DESC
	`

	rows, err := r.conn.Query(ctx, query)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پیام‌ها")
	}
	defer rows.Close()

	list := make([]Feedback, 0)
	for rows.Next() {
		var f Feedback
		if err := rows.Scan(&f.ID, &f.UserID, &f.Message, &f.CreatedAt, &f.UserNickName, &f.UserPhone, &f.LastReply); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		list = append(list, f)
	}
	if err := rows.Err(); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	return list, nil
}

// Get یک پیام پیشنهاد/انتقاد.
func (r DB) Get(ctx context.Context, id string) (Feedback, error) {
	const op = "postgresfeedback.Get"
	var f Feedback
	err := r.conn.QueryRow(ctx, `SELECT id::text, user_id::text, message, created_at::text FROM feedbacks WHERE id = $1`, id).
		Scan(&f.ID, &f.UserID, &f.Message, &f.CreatedAt)
	if err != nil {
		return Feedback{}, richerror.New(op).WithErr(err).WithMessage("پیام پیدا نشد").WithKind(richerror.KindNotFound)
	}
	return f, nil
}

// InsertReply جواب ادمین را ثبت می‌کند.
func (r DB) InsertReply(ctx context.Context, rp Reply) (Reply, error) {
	const op = "postgresfeedback.InsertReply"
	err := r.conn.QueryRow(ctx, `
		INSERT INTO support_replies (user_id, kind, ref_id, original, reply)
		VALUES ($1, $2, $3, $4, $5) RETURNING id::text, created_at::text`,
		rp.UserID, rp.Kind, rp.RefID, rp.Original, rp.Reply).Scan(&rp.ID, &rp.CreatedAt)
	if err != nil {
		return Reply{}, richerror.New(op).WithErr(err).WithMessage("خطا در ثبت جواب")
	}
	return rp, nil
}

// RepliesByUser جواب‌های ادمین به یک کاربر (جدیدترین اول).
func (r DB) RepliesByUser(ctx context.Context, userID string) ([]Reply, error) {
	const op = "postgresfeedback.RepliesByUser"
	rows, err := r.conn.Query(ctx, `
		SELECT id::text, kind, ref_id, original, reply, created_at::text
		FROM support_replies WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := make([]Reply, 0)
	for rows.Next() {
		var rp Reply
		if err := rows.Scan(&rp.ID, &rp.Kind, &rp.RefID, &rp.Original, &rp.Reply, &rp.CreatedAt); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, rp)
	}
	return out, rows.Err()
}
