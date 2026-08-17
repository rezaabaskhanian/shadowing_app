package postgresleitner

import (
	"context"

	"shadowing-backend/internal/domain/leitner"
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

const wordColumns = `id, user_id, word, meaning, level, next_review, created_at, updated_at`

func scanWord(row pgx.Row) (leitner.Word, error) {
	var w leitner.Word
	err := row.Scan(&w.ID, &w.UserID, &w.Word, &w.Meaning, &w.Level, &w.NextReview, &w.CreatedAt, &w.UpdatedAt)
	return w, err
}

// Create کلمه‌ی جدید را ذخیره می‌کند؛ اگر کاربر همین کلمه را قبلاً اضافه
// کرده باشد (dedup روی user_id+word)، چیزی درج نمی‌شود و خطایی هم برنمی‌گردد
// — دقیقاً همان رفتار dedup که سمت موبایل (VocabContext) از قبل دارد.
func (d DB) Create(ctx context.Context, w leitner.Word) error {
	const op = "postgres.LeitnerRepository.Create"

	query := `INSERT INTO leitner_words (` + wordColumns + `)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id, word) DO NOTHING`

	if _, err := d.conn.Exec(ctx, query, w.ID, w.UserID, w.Word, w.Meaning, w.Level, w.NextReview, w.CreatedAt, w.UpdatedAt); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to create leitner word")
	}
	return nil
}

// GetByID یک کلمه را با شناسه‌اش برمی‌گرداند.
func (d DB) GetByID(ctx context.Context, id uuid.UUID) (leitner.Word, error) {
	const op = "postgres.LeitnerRepository.GetByID"

	query := `SELECT ` + wordColumns + ` FROM leitner_words WHERE id = $1`

	w, err := scanWord(d.conn.QueryRow(ctx, query, id))
	if err != nil {
		if err == pgx.ErrNoRows {
			return leitner.Word{}, richerror.New(op).WithMessage("word not found").WithKind(richerror.KindNotFound)
		}
		return leitner.Word{}, richerror.New(op).WithErr(err)
	}
	return w, nil
}

// GetByUserAndWord یک کلمه‌ی مشخص را برای یک کاربر برمی‌گرداند — بعد از
// Create (که با ON CONFLICT DO NOTHING عمل می‌کند) برای گرفتن ردیف نهایی
// (چه تازه ساخته‌شده چه از قبل موجود) استفاده می‌شود.
func (d DB) GetByUserAndWord(ctx context.Context, userID uuid.UUID, word string) (leitner.Word, error) {
	const op = "postgres.LeitnerRepository.GetByUserAndWord"

	query := `SELECT ` + wordColumns + ` FROM leitner_words WHERE user_id = $1 AND word = $2`

	w, err := scanWord(d.conn.QueryRow(ctx, query, userID, word))
	if err != nil {
		if err == pgx.ErrNoRows {
			return leitner.Word{}, richerror.New(op).WithMessage("word not found").WithKind(richerror.KindNotFound)
		}
		return leitner.Word{}, richerror.New(op).WithErr(err)
	}
	return w, nil
}

// ListByUser همه‌ی کلمه‌های جعبه‌ی یک کاربر را برمی‌گرداند.
func (d DB) ListByUser(ctx context.Context, userID uuid.UUID) ([]leitner.Word, error) {
	const op = "postgres.LeitnerRepository.ListByUser"

	query := `SELECT ` + wordColumns + ` FROM leitner_words WHERE user_id = $1 ORDER BY created_at ASC`

	rows, err := d.conn.Query(ctx, query, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var words []leitner.Word
	for rows.Next() {
		w, err := scanWord(rows)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		words = append(words, w)
	}
	return words, nil
}

// Update سطح/تاریخ مرور بعدی یک کلمه را ذخیره می‌کند (بعد از Promote/Demote).
func (d DB) Update(ctx context.Context, w leitner.Word) error {
	const op = "postgres.LeitnerRepository.Update"

	query := `UPDATE leitner_words SET level = $1, next_review = $2, updated_at = $3 WHERE id = $4`

	result, err := d.conn.Exec(ctx, query, w.Level, w.NextReview, w.UpdatedAt, w.ID)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to update leitner word")
	}
	if result.RowsAffected() == 0 {
		return richerror.New(op).WithMessage("word not found").WithKind(richerror.KindNotFound)
	}
	return nil
}

// Delete یک کلمه را از جعبه‌ی کاربر حذف می‌کند.
func (d DB) Delete(ctx context.Context, id uuid.UUID) error {
	const op = "postgres.LeitnerRepository.Delete"

	if _, err := d.conn.Exec(ctx, `DELETE FROM leitner_words WHERE id = $1`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to delete leitner word")
	}
	return nil
}

// AvgLevelByUser میانگین سطح کلمه‌های کاربر را برمی‌گرداند (برای مهارت
// Vocabulary در «درصد مهارت‌ها»).
func (d DB) AvgLevelByUser(ctx context.Context, userID uuid.UUID) (avgLevel float64, wordCount int, err error) {
	const op = "postgres.LeitnerRepository.AvgLevelByUser"

	query := `SELECT COALESCE(AVG(level), 0), COUNT(*) FROM leitner_words WHERE user_id = $1`

	if err := d.conn.QueryRow(ctx, query, userID).Scan(&avgLevel, &wordCount); err != nil {
		return 0, 0, richerror.New(op).WithErr(err)
	}
	return avgLevel, wordCount, nil
}
