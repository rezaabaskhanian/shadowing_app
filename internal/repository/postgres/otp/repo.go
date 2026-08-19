package postgresotp

import (
	"context"
	"time"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

// Row یک رکورد otp_codes.
type Row struct {
	ID             uuid.UUID
	Phone          string
	Purpose        string
	Code           string
	Attempts       int
	ExpiresAt      time.Time
	VerifiedAt     *time.Time
	Token          *string
	TokenExpiresAt *time.Time
	ConsumedAt     *time.Time
	CreatedAt      time.Time
}

const rowColumns = `id, phone, purpose, code, attempts, expires_at, verified_at, token, token_expires_at, consumed_at, created_at`

func scanRow(row pgx.Row) (Row, error) {
	var r Row
	err := row.Scan(&r.ID, &r.Phone, &r.Purpose, &r.Code, &r.Attempts, &r.ExpiresAt, &r.VerifiedAt, &r.Token, &r.TokenExpiresAt, &r.ConsumedAt, &r.CreatedAt)
	return r, err
}

// Create یک کد OTP تازه برای شماره/هدف داده‌شده ذخیره می‌کند.
func (d DB) Create(ctx context.Context, phone, purpose, code string, expiresAt time.Time) (Row, error) {
	const op = "postgresotp.Create"

	query := `INSERT INTO otp_codes (phone, purpose, code, expires_at) VALUES ($1, $2, $3, $4)
        RETURNING ` + rowColumns

	r, err := scanRow(d.conn.QueryRow(ctx, query, phone, purpose, code, expiresAt))
	if err != nil {
		return Row{}, richerror.New(op).WithErr(err).WithMessage("failed to create otp code")
	}
	return r, nil
}

// LatestPending آخرین کد ارسال‌شده (تایید نشده و منقضی نشده) برای
// شماره/هدف را برمی‌گرداند — هم برای rate-limit ارسال و هم برای verify.
func (d DB) LatestPending(ctx context.Context, phone, purpose string) (Row, error) {
	const op = "postgresotp.LatestPending"

	query := `SELECT ` + rowColumns + ` FROM otp_codes
        WHERE phone = $1 AND purpose = $2 AND verified_at IS NULL
        ORDER BY created_at DESC LIMIT 1`

	r, err := scanRow(d.conn.QueryRow(ctx, query, phone, purpose))
	if err != nil {
		if err == pgx.ErrNoRows {
			return Row{}, richerror.New(op).WithMessage("otp not found").WithKind(richerror.KindNotFound)
		}
		return Row{}, richerror.New(op).WithErr(err)
	}
	return r, nil
}

// IncrementAttempts تعداد تلاش‌های ناموفق verify را یکی زیاد می‌کند.
func (d DB) IncrementAttempts(ctx context.Context, id uuid.UUID) error {
	const op = "postgresotp.IncrementAttempts"

	if _, err := d.conn.Exec(ctx, `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, id); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// MarkVerified کد را verify‌شده علامت می‌زند و توکن یک‌بارمصرف صادر می‌کند.
func (d DB) MarkVerified(ctx context.Context, id uuid.UUID, token string, tokenExpiresAt time.Time) error {
	const op = "postgresotp.MarkVerified"

	query := `UPDATE otp_codes SET verified_at = now(), token = $1, token_expires_at = $2 WHERE id = $3`
	if _, err := d.conn.Exec(ctx, query, token, tokenExpiresAt, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to mark otp verified")
	}
	return nil
}

// FindValidToken توکن verify‌شده‌ی معتبر (منقضی/مصرف‌نشده) برای
// شماره/هدف را پیدا می‌کند.
func (d DB) FindValidToken(ctx context.Context, phone, purpose, token string) (Row, error) {
	const op = "postgresotp.FindValidToken"

	query := `SELECT ` + rowColumns + ` FROM otp_codes
        WHERE phone = $1 AND purpose = $2 AND token = $3
          AND consumed_at IS NULL AND token_expires_at > now()
        LIMIT 1`

	r, err := scanRow(d.conn.QueryRow(ctx, query, phone, purpose, token))
	if err != nil {
		if err == pgx.ErrNoRows {
			return Row{}, richerror.New(op).WithMessage("token not found or expired").WithKind(richerror.KindNotFound)
		}
		return Row{}, richerror.New(op).WithErr(err)
	}
	return r, nil
}

// ConsumeToken توکن را یک‌بارمصرف می‌کند تا دوباره قابل استفاده نباشد.
func (d DB) ConsumeToken(ctx context.Context, id uuid.UUID) error {
	const op = "postgresotp.ConsumeToken"

	if _, err := d.conn.Exec(ctx, `UPDATE otp_codes SET consumed_at = now() WHERE id = $1`, id); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}
