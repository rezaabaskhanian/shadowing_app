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
