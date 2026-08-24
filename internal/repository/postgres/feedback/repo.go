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
			u.nickname, u.phone
		FROM feedbacks f
		JOIN users u ON u.id = f.user_id
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
		if err := rows.Scan(&f.ID, &f.UserID, &f.Message, &f.CreatedAt, &f.UserNickName, &f.UserPhone); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		list = append(list, f)
	}
	if err := rows.Err(); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	return list, nil
}
