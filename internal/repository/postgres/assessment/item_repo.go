package postgresassessment

import (
	"context"

	"shadowing-backend/internal/domain/assessment"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ItemRepository struct {
	db *pgxpool.Pool
}

func NewItemRepository(db *pgxpool.Pool) *ItemRepository {
	return &ItemRepository{db: db}
}

const itemColumns = `id, kind, category, prompt_text, target_text, audio_url, difficulty, is_active, created_at, updated_at`

func scanItem(row pgx.Row) (*assessment.AssessmentItem, error) {
	var it assessment.AssessmentItem
	var targetText, audioURL, difficulty *string
	if err := row.Scan(
		&it.ID, &it.Kind, &it.Category, &it.PromptText, &targetText, &audioURL, &difficulty,
		&it.IsActive, &it.CreatedAt, &it.UpdatedAt,
	); err != nil {
		return nil, err
	}
	if targetText != nil {
		it.TargetText = *targetText
	}
	if audioURL != nil {
		it.AudioURL = *audioURL
	}
	if difficulty != nil {
		it.Difficulty = assessment.Difficulty(*difficulty)
	}
	return &it, nil
}

// Create - افزودن یک آیتم جدید (پنل ادمین)
func (r *ItemRepository) Create(ctx context.Context, it *assessment.AssessmentItem) error {
	const op = "postgresassessment.ItemRepository.Create"

	query := `INSERT INTO assessment_items (id, kind, category, prompt_text, target_text, audio_url, difficulty, is_active, created_at, updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err := r.db.Exec(ctx, query,
		it.ID, it.Kind, it.Category, it.PromptText, nullable(it.TargetText), nullable(it.AudioURL), nullable(string(it.Difficulty)),
		it.IsActive, it.CreatedAt, it.UpdatedAt,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to create assessment item")
	}
	return nil
}

// Update - ویرایش یک آیتم (پنل ادمین)
func (r *ItemRepository) Update(ctx context.Context, it *assessment.AssessmentItem) error {
	const op = "postgresassessment.ItemRepository.Update"

	query := `UPDATE assessment_items SET
		kind = $1, category = $2, prompt_text = $3, target_text = $4, audio_url = $5,
		difficulty = $6, is_active = $7, updated_at = $8
	WHERE id = $9`

	result, err := r.db.Exec(ctx, query,
		it.Kind, it.Category, it.PromptText, nullable(it.TargetText), nullable(it.AudioURL),
		nullable(string(it.Difficulty)), it.IsActive, it.UpdatedAt, it.ID,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to update assessment item")
	}
	if result.RowsAffected() == 0 {
		return richerror.New(op).WithMessage("assessment item not found").WithKind(richerror.KindNotFound)
	}
	return nil
}

// Delete - حذف یک آیتم (پنل ادمین)
func (r *ItemRepository) Delete(ctx context.Context, id uuid.UUID) error {
	const op = "postgresassessment.ItemRepository.Delete"

	result, err := r.db.Exec(ctx, `DELETE FROM assessment_items WHERE id = $1`, id)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to delete assessment item")
	}
	if result.RowsAffected() == 0 {
		return richerror.New(op).WithMessage("assessment item not found").WithKind(richerror.KindNotFound)
	}
	return nil
}

// List - همه‌ی آیتم‌ها برای نمایش جدول پنل ادمین (فعال و غیرفعال)
func (r *ItemRepository) List(ctx context.Context) ([]assessment.AssessmentItem, error) {
	const op = "postgresassessment.ItemRepository.List"

	rows, err := r.db.Query(ctx, `SELECT `+itemColumns+` FROM assessment_items ORDER BY created_at DESC`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var items []assessment.AssessmentItem
	for rows.Next() {
		it, err := scanItem(rows)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		items = append(items, *it)
	}
	return items, nil
}

// GetByIDs - برای اعتبارسنجی آیتم‌های ارسالی هنگام Submit (هرگز به kind/متن
// ارسالی کلاینت اعتماد نمی‌کنیم)
func (r *ItemRepository) GetByIDs(ctx context.Context, ids []uuid.UUID) ([]assessment.AssessmentItem, error) {
	const op = "postgresassessment.ItemRepository.GetByIDs"

	rows, err := r.db.Query(ctx, `SELECT `+itemColumns+` FROM assessment_items WHERE id = ANY($1)`, ids)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var items []assessment.AssessmentItem
	for rows.Next() {
		it, err := scanItem(rows)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		items = append(items, *it)
	}
	return items, nil
}

// RandomActive - یک آیتم فعال تصادفی از kind/category داده‌شده برمی‌گرداند.
// category برای kind=shadow نادیده گرفته می‌شود (رشته‌ی خالی بفرستید).
func (r *ItemRepository) RandomActive(ctx context.Context, kind assessment.Kind, category assessment.Category) (*assessment.AssessmentItem, error) {
	const op = "postgresassessment.ItemRepository.RandomActive"

	var row pgx.Row
	if category == "" {
		row = r.db.QueryRow(ctx, `SELECT `+itemColumns+` FROM assessment_items
			WHERE kind = $1 AND is_active ORDER BY random() LIMIT 1`, kind)
	} else {
		row = r.db.QueryRow(ctx, `SELECT `+itemColumns+` FROM assessment_items
			WHERE kind = $1 AND category = $2 AND is_active ORDER BY random() LIMIT 1`, kind, category)
	}

	it, err := scanItem(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, richerror.New(op).WithMessage("no active assessment item found").WithKind(richerror.KindNotFound)
		}
		return nil, richerror.New(op).WithErr(err)
	}
	return it, nil
}

// RandomActiveShadow - یک آیتم shadow فعال و تصادفی از یک سطح دشواری مشخص.
// برای اینکه سطح نهایی از میانگین چند جمله با دشواری‌های متفاوت ساخته شود،
// نه از یک جمله‌ی تصادفی (که می‌تواند شانسی خوب/بد باشد).
func (r *ItemRepository) RandomActiveShadow(ctx context.Context, difficulty assessment.Difficulty) (*assessment.AssessmentItem, error) {
	const op = "postgresassessment.ItemRepository.RandomActiveShadow"

	row := r.db.QueryRow(ctx, `SELECT `+itemColumns+` FROM assessment_items
		WHERE kind = $1 AND difficulty = $2 AND is_active ORDER BY random() LIMIT 1`,
		assessment.KindShadow, difficulty)

	it, err := scanItem(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, richerror.New(op).WithMessage("no active shadow item found for this difficulty").WithKind(richerror.KindNotFound)
		}
		return nil, richerror.New(op).WithErr(err)
	}
	return it, nil
}

func nullable(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
