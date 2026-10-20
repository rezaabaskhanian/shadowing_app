package postgresassessment

import (
	"context"
	"encoding/json"

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

const itemColumns = `id, kind, category, prompt_text, target_text, audio_url, difficulty, cefr, band, is_pseudo, options, correct_index, is_active, created_at, updated_at`

func scanItem(row pgx.Row) (*assessment.AssessmentItem, error) {
	var it assessment.AssessmentItem
	var targetText, audioURL, difficulty *string
	var cefr string
	var band, correct int16
	var options []byte
	if err := row.Scan(
		&it.ID, &it.Kind, &it.Category, &it.PromptText, &targetText, &audioURL, &difficulty,
		&cefr, &band, &it.IsPseudo, &options, &correct,
		&it.IsActive, &it.CreatedAt, &it.UpdatedAt,
	); err != nil {
		return nil, err
	}
	it.CEFR = assessment.Level(cefr)
	it.Band = int(band)
	it.CorrectIndex = int(correct)
	if len(options) > 0 {
		_ = json.Unmarshal(options, &it.Options)
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

	query := `INSERT INTO assessment_items (id, kind, category, prompt_text, target_text, audio_url, difficulty,
		cefr, band, is_pseudo, options, correct_index, is_active, created_at, updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`

	_, err := r.db.Exec(ctx, query,
		it.ID, it.Kind, it.Category, it.PromptText, nullable(it.TargetText), nullable(it.AudioURL), nullable(string(it.Difficulty)),
		string(it.CEFR), it.Band, it.IsPseudo, optionsJSON(it.Options), correctIndex(it),
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
		difficulty = $6, cefr = $7, band = $8, is_pseudo = $9, options = $10, correct_index = $11,
		is_active = $12, updated_at = $13
	WHERE id = $14`

	result, err := r.db.Exec(ctx, query,
		it.Kind, it.Category, it.PromptText, nullable(it.TargetText), nullable(it.AudioURL),
		nullable(string(it.Difficulty)), string(it.CEFR), it.Band, it.IsPseudo, optionsJSON(it.Options), correctIndex(it),
		it.IsActive, it.UpdatedAt, it.ID,
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

// ListActiveByKinds - همه‌ی آیتم‌های فعال از چند kind (برای تست نسخه‌ی ۲ که
// کل استخر بخش‌ها را یک‌جا می‌فرستد و اپ قاعده‌های تطبیقی را اجرا می‌کند).
func (r *ItemRepository) ListActiveByKinds(ctx context.Context, kinds []assessment.Kind) ([]assessment.AssessmentItem, error) {
	const op = "postgresassessment.ItemRepository.ListActiveByKinds"

	ks := make([]string, len(kinds))
	for i, k := range kinds {
		ks[i] = string(k)
	}
	rows, err := r.db.Query(ctx, `SELECT `+itemColumns+` FROM assessment_items
		WHERE is_active AND kind = ANY($1) ORDER BY random()`, ks)
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

func optionsJSON(opts []string) []byte {
	if opts == nil {
		opts = []string{}
	}
	b, _ := json.Marshal(opts)
	return b
}

// correctIndex فقط برای listen_choice معنا دارد؛ برای بقیه ‎-1 ذخیره می‌شود.
func correctIndex(it *assessment.AssessmentItem) int {
	if it.Kind != assessment.KindListenChoice {
		return -1
	}
	return it.CorrectIndex
}

func nullable(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
