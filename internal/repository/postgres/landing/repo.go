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
