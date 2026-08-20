package postgreslanding

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

type Image struct {
	ID       uuid.UUID
	URL      string
	Position int
}

type Section struct {
	ID          uuid.UUID
	TabLabel    string
	Title       string
	Description string
	Position    int
	Images      []Image
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type Settings struct {
	HeroTitle     string
	HeroSubtitle  string
	HeroImageURL  string
	GooglePlayURL string
	BazaarURL     string
	CTATitle      string
	CTASubtitle   string
	UpdatedAt     time.Time
}

type Highlight struct {
	ID          uuid.UUID
	Kind        string
	Icon        string
	Title       string
	Description string
	Position    int
}

type FAQ struct {
	ID       uuid.UUID
	Question string
	Answer   string
	Position int
}

// ListWithImages همه‌ی بخش‌ها را به ترتیب position به همراه عکس‌هایشان
// برمی‌گرداند — هم برای صفحه‌ی عمومی landing و هم برای پنل ادمین.
func (d DB) ListWithImages(ctx context.Context) ([]Section, error) {
	const op = "postgreslanding.ListWithImages"

	rows, err := d.conn.Query(ctx, `
        SELECT id, tab_label, title, description, position, created_at, updated_at
        FROM landing_sections ORDER BY position ASC, created_at ASC`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	sections := make([]Section, 0)
	byID := make(map[uuid.UUID]*Section)
	for rows.Next() {
		var s Section
		if err := rows.Scan(&s.ID, &s.TabLabel, &s.Title, &s.Description, &s.Position, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		s.Images = []Image{}
		sections = append(sections, s)
	}
	for i := range sections {
		byID[sections[i].ID] = &sections[i]
	}

	if len(sections) == 0 {
		return sections, nil
	}

	imgRows, err := d.conn.Query(ctx, `
        SELECT id, section_id, image_url, position FROM landing_section_images
        ORDER BY position ASC, created_at ASC`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer imgRows.Close()

	for imgRows.Next() {
		var img Image
		var sectionID uuid.UUID
		if err := imgRows.Scan(&img.ID, &sectionID, &img.URL, &img.Position); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		if s, ok := byID[sectionID]; ok {
			s.Images = append(s.Images, img)
		}
	}

	return sections, nil
}

// Create یک بخش تازه می‌سازد.
func (d DB) Create(ctx context.Context, tabLabel, title, description string, position int) (Section, error) {
	const op = "postgreslanding.Create"

	var s Section
	query := `INSERT INTO landing_sections (tab_label, title, description, position)
        VALUES ($1, $2, $3, $4)
        RETURNING id, tab_label, title, description, position, created_at, updated_at`

	err := d.conn.QueryRow(ctx, query, tabLabel, title, description, position).
		Scan(&s.ID, &s.TabLabel, &s.Title, &s.Description, &s.Position, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return Section{}, richerror.New(op).WithErr(err).WithMessage("failed to create landing section")
	}
	s.Images = []Image{}
	return s, nil
}

// Update فیلدهای یک بخش را عوض می‌کند.
func (d DB) Update(ctx context.Context, id uuid.UUID, tabLabel, title, description string, position int) error {
	const op = "postgreslanding.Update"

	query := `UPDATE landing_sections SET tab_label = $1, title = $2, description = $3, position = $4, updated_at = now()
        WHERE id = $5`

	result, err := d.conn.Exec(ctx, query, tabLabel, title, description, position, id)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to update landing section")
	}
	if result.RowsAffected() == 0 {
		return richerror.New(op).WithMessage("section not found").WithKind(richerror.KindNotFound)
	}
	return nil
}

// Delete یک بخش را (و عکس‌هایش را با CASCADE) حذف می‌کند.
func (d DB) Delete(ctx context.Context, id uuid.UUID) error {
	const op = "postgreslanding.Delete"

	if _, err := d.conn.Exec(ctx, `DELETE FROM landing_sections WHERE id = $1`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to delete landing section")
	}
	return nil
}

// AddImage یک عکس تازه به یک بخش اضافه می‌کند.
func (d DB) AddImage(ctx context.Context, sectionID uuid.UUID, url string, position int) (Image, error) {
	const op = "postgreslanding.AddImage"

	var img Image
	query := `INSERT INTO landing_section_images (section_id, image_url, position)
        VALUES ($1, $2, $3) RETURNING id, image_url, position`

	err := d.conn.QueryRow(ctx, query, sectionID, url, position).Scan(&img.ID, &img.URL, &img.Position)
	if err != nil {
		if err == pgx.ErrNoRows {
			return Image{}, richerror.New(op).WithMessage("section not found").WithKind(richerror.KindNotFound)
		}
		return Image{}, richerror.New(op).WithErr(err).WithMessage("failed to add image")
	}
	return img, nil
}

// DeleteImage یک عکس را حذف می‌کند.
func (d DB) DeleteImage(ctx context.Context, imageID uuid.UUID) error {
	const op = "postgreslanding.DeleteImage"

	if _, err := d.conn.Exec(ctx, `DELETE FROM landing_section_images WHERE id = $1`, imageID); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to delete image")
	}
	return nil
}

// GetSettings تنظیمات کلی صفحه‌ی معرفی (هیرو، دکمه‌های دانلود، بنر پایانی) را برمی‌گرداند.
func (d DB) GetSettings(ctx context.Context) (Settings, error) {
	const op = "postgreslanding.GetSettings"

	var s Settings
	query := `SELECT hero_title, hero_subtitle, hero_image_url, google_play_url, bazaar_url, cta_title, cta_subtitle, updated_at
        FROM landing_settings WHERE id = 1`

	err := d.conn.QueryRow(ctx, query).Scan(
		&s.HeroTitle, &s.HeroSubtitle, &s.HeroImageURL, &s.GooglePlayURL, &s.BazaarURL, &s.CTATitle, &s.CTASubtitle, &s.UpdatedAt,
	)
	if err != nil {
		return Settings{}, richerror.New(op).WithErr(err).WithMessage("failed to get landing settings")
	}
	return s, nil
}

// UpdateSettings تنظیمات کلی صفحه‌ی معرفی را ویرایش می‌کند.
func (d DB) UpdateSettings(ctx context.Context, s Settings) error {
	const op = "postgreslanding.UpdateSettings"

	query := `UPDATE landing_settings SET
        hero_title = $1, hero_subtitle = $2, hero_image_url = $3,
        google_play_url = $4, bazaar_url = $5, cta_title = $6, cta_subtitle = $7,
        updated_at = now()
        WHERE id = 1`

	if _, err := d.conn.Exec(ctx, query,
		s.HeroTitle, s.HeroSubtitle, s.HeroImageURL, s.GooglePlayURL, s.BazaarURL, s.CTATitle, s.CTASubtitle,
	); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to update landing settings")
	}
	return nil
}

// ListHighlights آیتم‌های یک نوع مشخص (feature یا step) را به ترتیب position برمی‌گرداند.
func (d DB) ListHighlights(ctx context.Context, kind string) ([]Highlight, error) {
	const op = "postgreslanding.ListHighlights"

	rows, err := d.conn.Query(ctx, `
        SELECT id, kind, icon, title, description, position FROM landing_highlights
        WHERE kind = $1 ORDER BY position ASC, created_at ASC`, kind)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	highlights := make([]Highlight, 0)
	for rows.Next() {
		var h Highlight
		if err := rows.Scan(&h.ID, &h.Kind, &h.Icon, &h.Title, &h.Description, &h.Position); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		highlights = append(highlights, h)
	}
	return highlights, nil
}

// CreateHighlight یک آیتم تازه (فیچر یا مرحله) می‌سازد.
func (d DB) CreateHighlight(ctx context.Context, kind, icon, title, description string, position int) (Highlight, error) {
	const op = "postgreslanding.CreateHighlight"

	var h Highlight
	query := `INSERT INTO landing_highlights (kind, icon, title, description, position)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, kind, icon, title, description, position`

	err := d.conn.QueryRow(ctx, query, kind, icon, title, description, position).
		Scan(&h.ID, &h.Kind, &h.Icon, &h.Title, &h.Description, &h.Position)
	if err != nil {
		return Highlight{}, richerror.New(op).WithErr(err).WithMessage("failed to create highlight")
	}
	return h, nil
}

// UpdateHighlight فیلدهای یک آیتم را عوض می‌کند (نوع/kind قابل تغییر نیست).
func (d DB) UpdateHighlight(ctx context.Context, id uuid.UUID, icon, title, description string, position int) error {
	const op = "postgreslanding.UpdateHighlight"

	query := `UPDATE landing_highlights SET icon = $1, title = $2, description = $3, position = $4, updated_at = now()
        WHERE id = $5`

	result, err := d.conn.Exec(ctx, query, icon, title, description, position, id)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to update highlight")
	}
	if result.RowsAffected() == 0 {
		return richerror.New(op).WithMessage("highlight not found").WithKind(richerror.KindNotFound)
	}
	return nil
}

// DeleteHighlight یک آیتم را حذف می‌کند.
func (d DB) DeleteHighlight(ctx context.Context, id uuid.UUID) error {
	const op = "postgreslanding.DeleteHighlight"

	if _, err := d.conn.Exec(ctx, `DELETE FROM landing_highlights WHERE id = $1`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to delete highlight")
	}
	return nil
}

// ListFAQs سوالات متداول را به ترتیب position برمی‌گرداند.
func (d DB) ListFAQs(ctx context.Context) ([]FAQ, error) {
	const op = "postgreslanding.ListFAQs"

	rows, err := d.conn.Query(ctx, `
        SELECT id, question, answer, position FROM landing_faqs
        ORDER BY position ASC, created_at ASC`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	faqs := make([]FAQ, 0)
	for rows.Next() {
		var f FAQ
		if err := rows.Scan(&f.ID, &f.Question, &f.Answer, &f.Position); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		faqs = append(faqs, f)
	}
	return faqs, nil
}

// CreateFAQ یک سوال متداول تازه می‌سازد.
func (d DB) CreateFAQ(ctx context.Context, question, answer string, position int) (FAQ, error) {
	const op = "postgreslanding.CreateFAQ"

	var f FAQ
	query := `INSERT INTO landing_faqs (question, answer, position)
        VALUES ($1, $2, $3) RETURNING id, question, answer, position`

	err := d.conn.QueryRow(ctx, query, question, answer, position).Scan(&f.ID, &f.Question, &f.Answer, &f.Position)
	if err != nil {
		return FAQ{}, richerror.New(op).WithErr(err).WithMessage("failed to create faq")
	}
	return f, nil
}

// UpdateFAQ فیلدهای یک سوال متداول را عوض می‌کند.
func (d DB) UpdateFAQ(ctx context.Context, id uuid.UUID, question, answer string, position int) error {
	const op = "postgreslanding.UpdateFAQ"

	query := `UPDATE landing_faqs SET question = $1, answer = $2, position = $3, updated_at = now() WHERE id = $4`

	result, err := d.conn.Exec(ctx, query, question, answer, position, id)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to update faq")
	}
	if result.RowsAffected() == 0 {
		return richerror.New(op).WithMessage("faq not found").WithKind(richerror.KindNotFound)
	}
	return nil
}

// DeleteFAQ یک سوال متداول را حذف می‌کند.
func (d DB) DeleteFAQ(ctx context.Context, id uuid.UUID) error {
	const op = "postgreslanding.DeleteFAQ"

	if _, err := d.conn.Exec(ctx, `DELETE FROM landing_faqs WHERE id = $1`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to delete faq")
	}
	return nil
}
