package postgresuser

import (
	"context"
	"fmt"
	domain "shadowing-backend/internal/domain/user"
	uservalueobject "shadowing-backend/internal/domain/user/valueobject"
	"shadowing-backend/internal/pkg/errmesg"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5"
)

func (r DB) CreateUser(u domain.User) (domain.User, error) {

	const op = "postgres.CreateUser"

	query := `INSERT INTO users (
    id, nickname, password_hash,phone,role , created_at, updated_at
) VALUES ($1, $2, $3, $4, $5,now(), now())
RETURNING id;`

	var id string
	err := r.conn.QueryRow(
		context.Background(),
		query,
		u.ID,
		u.NickName,
		u.Password.Hash(),
		u.Phone,
		u.Role,
	).Scan(&id)

	if err != nil {
		return domain.User{}, richerror.New(op).WithErr(err).WithMessage("failed to insert user")
	}

	uid, err := uservalueobject.ParseUserID(id)
	if err != nil {
		return domain.User{}, richerror.New(op).WithErr(err).WithMessage("invalid UUID returned")
	}

	u.ID = uid

	return u, nil

}

// GetUserByID implements [userservice.Repository].
func (r DB) GetUserByID(ID string) (domain.User, error) {

	const op = "postgres.GetUserByID"

	const query = `
        SELECT id, nickname,password_hash, phone,role, created_at, updated_at
        FROM users
        WHERE id = $1
    `

	var (
		u      domain.User
		rawID  string // یا uuid.UUID بسته به نوع ستون در دیتابیس
		rawPwd string // هش پسورد به‌صورت رشته
	)

	// دریافت مقادیر از دیتابیس
	err := r.conn.QueryRow(context.Background(), query, ID).Scan(
		&rawID,
		&u.NickName,
		&rawPwd,
		&u.Phone,
		&u.Role,
		&u.CreatedAt,
		&u.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return domain.User{}, richerror.New(op).
				WithErr(err).
				WithMessage(errmesg.ErrorMsgCantScanQueryResult).
				WithKind(richerror.KindUnexpected)
		}
		return domain.User{}, err
	}

	// تبدیل UUID رشته‌ای به value‑object
	uid, err := uservalueobject.ParseUserID(rawID)
	if err != nil {
		return domain.User{}, richerror.New(op).
			WithErr(err).
			WithMessage("invalid UUID returned from DB")
	}
	u.ID = uid

	u.Password = *uservalueobject.NewPasswordFromHash(rawPwd)

	return u, nil
}

// GetUserByNickName implements [userservice.Repository].
func (r DB) GetUserByPhoneNumber(phone string) (domain.User, error) {
	const op = "postgres.GetUserByPhoneNumber"

	query := ` SELECT id, nickname,password_hash,phone,role , created_at, updated_at
        FROM users
        WHERE phone = $1`
	var (
		u      domain.User
		rawID  string // یا uuid.UUID بسته به نوع ستون در دیتابیس
		rawPwd string // هش پسورد به‌صورت رشته
	)

	err := r.conn.QueryRow(context.Background(), query, phone).Scan(
		&rawID,
		&u.NickName,
		&rawPwd,

		&u.Phone,
		&u.Role,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {

		if err == pgx.ErrNoRows {
			return domain.User{}, richerror.New(op).
				WithErr(err).
				WithMessage(errmesg.ErrorMsgCantScanQueryResult).
				WithKind(richerror.KindUnexpected)
		}
		return domain.User{}, err

	}

	uid, err := uservalueobject.ParseUserID(rawID)
	if err != nil {
		return domain.User{}, richerror.New(op).
			WithErr(err).
			WithMessage("invalid UUID returned from DB")
	}
	u.ID = uid

	u.Password = *uservalueobject.NewPasswordFromHash(rawPwd)

	return u, nil

}

// ResetPassword implements [userservice.Repository].
func (r DB) ResetPassword(nikname string, hashedPassword uservalueobject.Password) error {

	const op = "postgres.ResetPassword"

	query := `UPDATE users SET password_hash = $1 WHERE nickname = $2`

	fmt.Println(hashedPassword, nikname, "hashedPassword, nikname")

	cmdTag, err := r.conn.Exec(context.Background(), query, hashedPassword.Hash(), nikname)

	if err != nil {
		return richerror.New(op).WithErr(err)
	}

	// این میره تو خود دیتابیس میگرده اگه نبود میگه یوزر نیست

	if cmdTag.RowsAffected() == 0 {
		return richerror.New(op).WithMessage("user not found")
	}

	return nil
}

func (d DB) UpdateRole(ctx context.Context, userID string, role string) error {

	// UpdateRole تغییر نقش کاربر

	const op = "postgresuser.UpdateRole"

	query := `
        UPDATE users 
        SET role = $2, updated_at = NOW()
        WHERE id = $1
    `

	result, err := d.conn.Exec(ctx, query, userID, role)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to update user role")
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return richerror.New(op).WithMessage("user not found")
	}

	return nil
}

// Count تعداد کل کاربران
func (d DB) Count(ctx context.Context) (int, error) {
	const op = "postgresuser.Count"

	query := `SELECT COUNT(*) FROM users`

	var count int
	err := d.conn.QueryRow(ctx, query).Scan(&count)
	if err != nil {
		return 0, richerror.New(op).WithErr(err).WithMessage("failed to count users")
	}

	return count, nil
}

// FindAll گرفتن همه کاربران با صفحه‌بندی
func (d DB) FindAll(ctx context.Context, limit, offset int) ([]domain.User, error) {
	const op = "postgresuser.FindAll"

	query := `
        SELECT 
            id, nickname, phone, password_hash, role, 
            created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
    `

	rows, err := d.conn.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("failed to query users")
	}
	defer rows.Close()

	var users []domain.User

	for rows.Next() {
		var u domain.User
		var rawID string
		var rawPasswordHash string

		err := rows.Scan(
			&rawID,
			&u.NickName,
			&u.Phone,
			// &u.Email,
			&rawPasswordHash,
			&u.Role,
			&u.CreatedAt,
			&u.UpdatedAt,
		)
		if err != nil {
			return nil, richerror.New(op).WithErr(err).WithMessage("failed to scan user")
		}

		u.ID, err = uservalueobject.ParseUserID(rawID)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		u.Password = *uservalueobject.NewPasswordFromHash(rawPasswordHash)

		users = append(users, u)
	}

	if err = rows.Err(); err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("rows iteration error")
	}

	return users, nil
}

// UserActivityRow خلاصه‌ی فعالیت یک کاربر برای صفحه‌ی «کاربران» پنل ادمین —
// به‌جای صدازدن جدا-جدا (N+1) endpointهای progress برای هر کاربر، همه‌چیز با
// یک کوئری JOIN/تجمیعی خوانده می‌شود.
type UserActivityRow struct {
	ID                    string  `json:"id"`
	NickName              string  `json:"nickname"`
	Phone                 string  `json:"phone"`
	Role                  string  `json:"role"`
	Points                int     `json:"points"`
	CreatedAt             string  `json:"created_at"`
	CurrentStreak         int     `json:"current_streak"`
	CompletedScenes       int     `json:"completed_scenes"`
	LastActivityAt        *string `json:"last_activity_at"`
	HasActiveSubscription bool    `json:"has_active_subscription"`
}

// CountWithSearch تعداد کاربرهایی که با فیلتر جست‌وجو (نام/شماره) مطابقت
// دارند را برمی‌گرداند — برای صفحه‌بندی لیست کاربران ادمین.
func (d DB) CountWithSearch(ctx context.Context, search string) (int, error) {
	const op = "postgresuser.CountWithSearch"

	var count int
	err := d.conn.QueryRow(ctx, `
		SELECT COUNT(*) FROM users
		WHERE ($1 = '' OR nickname ILIKE '%' || $1 || '%' OR phone ILIKE '%' || $1 || '%')
	`, search).Scan(&count)
	if err != nil {
		return 0, richerror.New(op).WithErr(err).WithMessage("failed to count users")
	}
	return count, nil
}

// ListWithActivity کاربرها را همراه با استریک، تعداد صحنه‌ی تکمیل‌شده، آخرین
// فعالیت و وضعیت اشتراک فعال برمی‌گرداند (برای صفحه‌ی کاربران پنل ادمین).
func (d DB) ListWithActivity(ctx context.Context, limit, offset int, search string) ([]UserActivityRow, error) {
	const op = "postgresuser.ListWithActivity"

	const query = `
		SELECT
			u.id::text, u.nickname, u.phone, u.role, u.points, u.created_at::text,
			COALESCE(s.current, 0) AS current_streak,
			COALESCE(sp.completed_count, 0) AS completed_scenes,
			sp.last_activity_at::text,
			COALESCE(sub.has_active, false) AS has_active_subscription
		FROM users u
		LEFT JOIN streaks s ON s.user_id = u.id
		LEFT JOIN (
			SELECT user_id,
				COUNT(*) FILTER (WHERE is_completed) AS completed_count,
				MAX(last_accessed_at) AS last_activity_at
			FROM scene_progress
			GROUP BY user_id
		) sp ON sp.user_id = u.id
		LEFT JOIN (
			SELECT user_id, true AS has_active
			FROM user_subscriptions
			WHERE status = 'active' AND expires_at > now()
			GROUP BY user_id
		) sub ON sub.user_id = u.id
		WHERE ($3 = '' OR u.nickname ILIKE '%' || $3 || '%' OR u.phone ILIKE '%' || $3 || '%')
		ORDER BY u.created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := d.conn.Query(ctx, query, limit, offset, search)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("failed to query users activity")
	}
	defer rows.Close()

	var list []UserActivityRow
	for rows.Next() {
		var row UserActivityRow
		if err := rows.Scan(
			&row.ID, &row.NickName, &row.Phone, &row.Role, &row.Points, &row.CreatedAt,
			&row.CurrentStreak, &row.CompletedScenes, &row.LastActivityAt, &row.HasActiveSubscription,
		); err != nil {
			return nil, richerror.New(op).WithErr(err).WithMessage("failed to scan user activity row")
		}
		list = append(list, row)
	}
	if err := rows.Err(); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	return list, nil
}
