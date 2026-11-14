package postgrespodcast

import (
	"context"
	"encoding/json"
	"errors"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

type VocabItem struct {
	Word      string `json:"word"`
	MeaningFa string `json:"meaning_fa"`
}

// Image یکی از عکس‌های پادکست؛ FromLine شماره‌ی جمله (از ۱) که عکس از آن
// به بعد نشان داده می‌شود، ۰ = خودکار.
type Image struct {
	URL      string `json:"url"`
	FromLine int    `json:"from_line"`
}

// Question سؤال چندگزینه‌ای فهمِ آخر فصلِ داستان؛ Answer اندیسِ گزینه‌ی درست.
type Question struct {
	Q       string   `json:"q"`
	QFa     string   `json:"q_fa"`
	Options []string `json:"options"`
	Answer  int      `json:"answer"`
}

type Line struct {
	ID            string `json:"id,omitempty"`
	Position      int    `json:"position"`
	Speaker       string `json:"speaker"`
	Text          string `json:"text"`
	TranslationFa string `json:"translation_fa"`
	StartMs       int    `json:"start_ms"`
	EndMs         int    `json:"end_ms"`
}

type Podcast struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	DescriptionFa string `json:"description_fa"`
	Level         string `json:"level"`
	// Kind: lesson (درسی)، featured (منتخب، موضوع آزاد و بی‌ربط به درس‌ها) یا
	// story (یک فصل از داستانِ بخش خواندن).
	Kind string `json:"kind"`
	// SeriesTitle و ChapterNo فصل‌های یک داستان را به هم وصل می‌کنند؛ Questions
	// سؤال‌های فهمِ آخر فصل (فقط برای story).
	SeriesTitle     string            `json:"series_title"`
	ChapterNo       int               `json:"chapter_no"`
	SeriesID        string            `json:"series_id,omitempty"`
	EpisodeNo       int               `json:"episode_no"`
	Questions       []Question        `json:"questions"`
	SceneID         string            `json:"scene_id"`
	Vocabulary      []VocabItem       `json:"vocabulary"`
	Voices          map[string]string `json:"voices"`
	AudioURL        string            `json:"audio_url"`
	AudioStatus     string            `json:"audio_status"`
	AudioError      string            `json:"audio_error"`
	DurationSeconds int               `json:"duration_seconds"`
	ImageURL        string            `json:"image_url"`
	// Images عکس‌های اسلایدشوی هنگام پخش (ImageURL همان عکس کارت است).
	Images []Image `json:"images"`
	// SpeechSpeed سرعت گفتار TTS (۰٫۷ تا ۱٫۲) و LineGapMs مکث بین جمله‌ها.
	SpeechSpeed float64 `json:"speech_speed"`
	LineGapMs   int     `json:"line_gap_ms"`
	// CoverURL تصویرِ کارت در اپ: image_url خودِ پادکست، وگرنه تصویرِ صحنه‌ی مرتبط.
	CoverURL  string `json:"cover_url"`
	Position  int    `json:"position"`
	IsActive  bool   `json:"is_active"`
	CreatedAt string `json:"created_at"`
	LineCount int    `json:"line_count"`
	Lines     []Line `json:"lines"`
}

type PodcastSeries struct {
	ID            string    `json:"id"`
	Title         string    `json:"title"`
	DescriptionFa string    `json:"description_fa"`
	Level         string    `json:"level"`
	CoverURL      string    `json:"cover_url"`
	Category      string    `json:"category"`
	Position      int       `json:"position"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     string    `json:"created_at"`
	EpisodesCount int       `json:"episodes_count"`
	TotalDuration int       `json:"total_duration"`
	Episodes      []Podcast `json:"episodes,omitempty"`
}

const podcastColumns = `p.id::text, p.title, p.description_fa, p.level, COALESCE(p.scene_id::text, ''), p.vocabulary, p.voices,
	p.audio_url, p.audio_status, p.audio_error, p.duration_seconds, p.position, p.is_active, p.created_at::text,
	(SELECT COUNT(*) FROM podcast_lines l WHERE l.podcast_id = p.id), p.image_url,
	COALESCE(NULLIF(p.image_url, ''), (SELECT s.background_image_url FROM scenes s WHERE s.id = p.scene_id), ''),
	p.speech_speed, p.line_gap_ms, p.kind, p.images, p.series_title, p.chapter_no, p.questions,
	COALESCE(p.series_id::text, ''), p.episode_no`

func scanPodcast(row pgx.Row, p *Podcast) error {
	var vocab, voices, images, questions []byte
	if err := row.Scan(&p.ID, &p.Title, &p.DescriptionFa, &p.Level, &p.SceneID, &vocab, &voices,
		&p.AudioURL, &p.AudioStatus, &p.AudioError, &p.DurationSeconds, &p.Position, &p.IsActive, &p.CreatedAt, &p.LineCount, &p.ImageURL, &p.CoverURL,
		&p.SpeechSpeed, &p.LineGapMs, &p.Kind, &images, &p.SeriesTitle, &p.ChapterNo, &questions,
		&p.SeriesID, &p.EpisodeNo); err != nil {
		return err
	}
	p.Vocabulary = []VocabItem{}
	_ = json.Unmarshal(vocab, &p.Vocabulary)
	p.Voices = map[string]string{}
	_ = json.Unmarshal(voices, &p.Voices)
	p.Images = []Image{}
	_ = json.Unmarshal(images, &p.Images)
	p.Questions = []Question{}
	_ = json.Unmarshal(questions, &p.Questions)
	p.Lines = []Line{}
	return nil
}

// List پادکست‌ها بدون خطوط. activeOnly برای اپ (فقط فعال و با صدای آماده).
func (r DB) List(ctx context.Context, activeOnly bool) ([]Podcast, error) {
	const op = "postgrespodcast.List"
	filter := ""
	if activeOnly {
		filter = "WHERE p.is_active AND p.audio_status = 'ready'"
	}
	rows, err := r.conn.Query(ctx, `SELECT `+podcastColumns+` FROM podcasts p `+filter+` ORDER BY p.position, p.series_title, p.chapter_no, p.created_at DESC`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := make([]Podcast, 0)
	for rows.Next() {
		var p Podcast
		if err := scanPodcast(rows, &p); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r DB) Get(ctx context.Context, id string) (Podcast, error) {
	const op = "postgrespodcast.Get"
	var p Podcast
	err := scanPodcast(r.conn.QueryRow(ctx, `SELECT `+podcastColumns+` FROM podcasts p WHERE p.id = $1::uuid`, id), &p)
	if errors.Is(err, pgx.ErrNoRows) {
		return Podcast{}, richerror.New(op).WithErr(err).WithMessage("پادکست پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Podcast{}, richerror.New(op).WithErr(err)
	}
	rows, err := r.conn.Query(ctx, `
		SELECT id::text, position, speaker, text, translation_fa, start_ms, end_ms
		FROM podcast_lines WHERE podcast_id = $1::uuid ORDER BY position`, id)
	if err != nil {
		return Podcast{}, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	for rows.Next() {
		var l Line
		if err := rows.Scan(&l.ID, &l.Position, &l.Speaker, &l.Text, &l.TranslationFa, &l.StartMs, &l.EndMs); err != nil {
			return Podcast{}, richerror.New(op).WithErr(err)
		}
		p.Lines = append(p.Lines, l)
	}
	return p, rows.Err()
}

// Save پادکست و خطوطش را ذخیره می‌کند. ویرایش متن، صدای قبلی را باطل می‌کند
// (audio_status = none) چون دیگر با متن جور نیست — مگر keepAudio.
func (r DB) Save(ctx context.Context, p Podcast, keepAudio bool) (string, error) {
	const op = "postgrespodcast.Save"
	vocab, _ := json.Marshal(p.Vocabulary)
	voices, _ := json.Marshal(p.Voices)
	if p.Images == nil {
		p.Images = []Image{}
	}
	images, _ := json.Marshal(p.Images)
	if p.Questions == nil {
		p.Questions = []Question{}
	}
	questions, _ := json.Marshal(p.Questions)
	var sceneID any
	if p.SceneID != "" {
		sceneID = p.SceneID
	}
	var seriesID any
	if p.SeriesID != "" {
		seriesID = p.SeriesID
	}

	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	defer tx.Rollback(ctx)

	id := p.ID
	if id == "" {
		err = tx.QueryRow(ctx, `
			INSERT INTO podcasts (title, description_fa, level, scene_id, vocabulary, voices, position, is_active, image_url,
				speech_speed, line_gap_ms, kind, images, series_title, chapter_no, questions, series_id, episode_no)
			VALUES ($1, $2, $3, $4::uuid, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::uuid, $18) RETURNING id::text`,
			p.Title, p.DescriptionFa, p.Level, sceneID, vocab, voices, p.Position, p.IsActive, p.ImageURL,
			p.SpeechSpeed, p.LineGapMs, p.Kind, images, p.SeriesTitle, p.ChapterNo, questions, seriesID, p.EpisodeNo).Scan(&id)
	} else {
		audioReset := ""
		if !keepAudio {
			audioReset = ", audio_url = '', audio_status = 'none', audio_error = '', duration_seconds = 0"
		}
		_, err = tx.Exec(ctx, `
			UPDATE podcasts SET title = $2, description_fa = $3, level = $4, scene_id = $5::uuid, vocabulary = $6,
				voices = $7, position = $8, is_active = $9, image_url = $10, speech_speed = $11, line_gap_ms = $12,
				kind = $13, images = $14, series_title = $15, chapter_no = $16, questions = $17,
				series_id = $18::uuid, episode_no = $19`+audioReset+`
			WHERE id = $1::uuid`,
			id, p.Title, p.DescriptionFa, p.Level, sceneID, vocab, voices, p.Position, p.IsActive, p.ImageURL,
			p.SpeechSpeed, p.LineGapMs, p.Kind, images, p.SeriesTitle, p.ChapterNo, questions, seriesID, p.EpisodeNo)
	}
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی پادکست")
	}

	if !keepAudio || p.ID == "" {
		if _, err := tx.Exec(ctx, `DELETE FROM podcast_lines WHERE podcast_id = $1::uuid`, id); err != nil {
			return "", richerror.New(op).WithErr(err)
		}
		for i, l := range p.Lines {
			if _, err := tx.Exec(ctx, `
				INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa)
				VALUES ($1::uuid, $2, $3, $4, $5)`, id, i, l.Speaker, l.Text, l.TranslationFa); err != nil {
				return "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی متن پادکست")
			}
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	return id, nil
}

func (r DB) Delete(ctx context.Context, id string) error {
	const op = "postgrespodcast.Delete"
	if _, err := r.conn.Exec(ctx, `DELETE FROM podcasts WHERE id = $1::uuid`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف پادکست")
	}
	return nil
}

// MarkGenerating فقط اگر الان در حال ساخت نیست وضعیت را generating می‌کند؛
// false یعنی ساخت دیگری در جریان است.
func (r DB) MarkGenerating(ctx context.Context, id string) (bool, error) {
	const op = "postgrespodcast.MarkGenerating"
	tag, err := r.conn.Exec(ctx, `
		UPDATE podcasts SET audio_status = 'generating', audio_error = ''
		WHERE id = $1::uuid AND audio_status <> 'generating'`, id)
	if err != nil {
		return false, richerror.New(op).WithErr(err)
	}
	return tag.RowsAffected() > 0, nil
}

// SetAudioReady صدای نهایی و زمان‌بندی جمله‌ها را ذخیره می‌کند.
func (r DB) SetAudioReady(ctx context.Context, id, url string, durationSeconds int, timings map[string][2]int) error {
	const op = "postgrespodcast.SetAudioReady"
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `
		UPDATE podcasts SET audio_url = $2, audio_status = 'ready', audio_error = '', duration_seconds = $3
		WHERE id = $1::uuid`, id, url, durationSeconds); err != nil {
		return richerror.New(op).WithErr(err)
	}
	for lineID, t := range timings {
		if _, err := tx.Exec(ctx, `UPDATE podcast_lines SET start_ms = $2, end_ms = $3 WHERE id = $1::uuid`, lineID, t[0], t[1]); err != nil {
			return richerror.New(op).WithErr(err)
		}
	}
	return tx.Commit(ctx)
}

func (r DB) SetAudioFailed(ctx context.Context, id, msg string) error {
	const op = "postgrespodcast.SetAudioFailed"
	if _, err := r.conn.Exec(ctx, `UPDATE podcasts SET audio_status = 'failed', audio_error = $2 WHERE id = $1::uuid`, id, msg); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// ResetGenerating ساخت‌های نیمه‌کاره (مثلاً قطع‌شده با ری‌استارت سرور) را «ناموفق» علامت می‌زند.
func (r DB) ResetGenerating(ctx context.Context) error {
	const op = "postgrespodcast.ResetGenerating"
	if _, err := r.conn.Exec(ctx, `
		UPDATE podcasts SET audio_status = 'failed', audio_error = 'ساخت صدا با ری‌استارت سرور قطع شد؛ دوباره بساز'
		WHERE audio_status = 'generating'`); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// ----------------- Podcast Series -----------------

// ListSeries لیست مجموعه‌ها را با تعداد قسمت‌ها و مجموع زمان برمی‌گرداند.
func (r DB) ListSeries(ctx context.Context, activeOnly bool) ([]PodcastSeries, error) {
	const op = "postgrespodcast.ListSeries"
	filter := ""
	if activeOnly {
		filter = "WHERE s.is_active"
	}

	query := `
		SELECT
			s.id::text, s.title, s.description_fa, s.level, s.cover_url, s.category,
			s.position, s.is_active, s.created_at::text,
			COUNT(p.id) FILTER (WHERE NOT $1 OR (p.is_active AND p.audio_status = 'ready')) AS episodes_count,
			COALESCE(SUM(p.duration_seconds) FILTER (WHERE NOT $1 OR (p.is_active AND p.audio_status = 'ready')), 0) AS total_duration
		FROM podcast_series s
		LEFT JOIN podcasts p ON p.series_id = s.id
		` + filter + `
		GROUP BY s.id
		ORDER BY s.position, s.created_at DESC`

	rows, err := r.conn.Query(ctx, query, activeOnly)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	out := make([]PodcastSeries, 0)
	for rows.Next() {
		var s PodcastSeries
		if err := rows.Scan(
			&s.ID, &s.Title, &s.DescriptionFa, &s.Level, &s.CoverURL, &s.Category,
			&s.Position, &s.IsActive, &s.CreatedAt, &s.EpisodesCount, &s.TotalDuration,
		); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

// GetSeries جزئیات مجموعه و لیست قسمت‌های آن را می‌آورد.
func (r DB) GetSeries(ctx context.Context, id string, activeOnly bool) (PodcastSeries, error) {
	const op = "postgrespodcast.GetSeries"
	var s PodcastSeries
	err := r.conn.QueryRow(ctx, `
		SELECT
			s.id::text, s.title, s.description_fa, s.level, s.cover_url, s.category,
			s.position, s.is_active, s.created_at::text,
			COUNT(p.id) FILTER (WHERE NOT $2 OR (p.is_active AND p.audio_status = 'ready')) AS episodes_count,
			COALESCE(SUM(p.duration_seconds) FILTER (WHERE NOT $2 OR (p.is_active AND p.audio_status = 'ready')), 0) AS total_duration
		FROM podcast_series s
		LEFT JOIN podcasts p ON p.series_id = s.id
		WHERE s.id = $1::uuid
		GROUP BY s.id`, id, activeOnly).Scan(
		&s.ID, &s.Title, &s.DescriptionFa, &s.Level, &s.CoverURL, &s.Category,
		&s.Position, &s.IsActive, &s.CreatedAt, &s.EpisodesCount, &s.TotalDuration,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return PodcastSeries{}, richerror.New(op).WithErr(err).WithMessage("مجموعه پادکست پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return PodcastSeries{}, richerror.New(op).WithErr(err)
	}

	filter := ""
	if activeOnly {
		filter = "AND p.is_active AND p.audio_status = 'ready'"
	}
	rows, err := r.conn.Query(ctx, `
		SELECT `+podcastColumns+`
		FROM podcasts p
		WHERE p.series_id = $1::uuid `+filter+`
		ORDER BY p.episode_no, p.created_at ASC`, id)
	if err != nil {
		return PodcastSeries{}, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	s.Episodes = make([]Podcast, 0)
	for rows.Next() {
		var ep Podcast
		if err := scanPodcast(rows, &ep); err != nil {
			return PodcastSeries{}, richerror.New(op).WithErr(err)
		}
		s.Episodes = append(s.Episodes, ep)
	}
	return s, rows.Err()
}

// SaveSeries ایجاد یا ویرایش یک مجموعه پادکست.
func (r DB) SaveSeries(ctx context.Context, s PodcastSeries) (string, error) {
	const op = "postgrespodcast.SaveSeries"
	id := s.ID
	var err error
	if id == "" {
		err = r.conn.QueryRow(ctx, `
			INSERT INTO podcast_series (title, description_fa, level, cover_url, category, position, is_active)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id::text`,
			s.Title, s.DescriptionFa, s.Level, s.CoverURL, s.Category, s.Position, s.IsActive).Scan(&id)
	} else {
		_, err = r.conn.Exec(ctx, `
			UPDATE podcast_series
			SET title = $2, description_fa = $3, level = $4, cover_url = $5, category = $6, position = $7, is_active = $8
			WHERE id = $1::uuid`,
			id, s.Title, s.DescriptionFa, s.Level, s.CoverURL, s.Category, s.Position, s.IsActive)
	}
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره مجموعه پادکست")
	}
	return id, nil
}

// DeleteSeries حذف مجموعه پادکست.
func (r DB) DeleteSeries(ctx context.Context, id string) error {
	const op = "postgrespodcast.DeleteSeries"
	if _, err := r.conn.Exec(ctx, `DELETE FROM podcast_series WHERE id = $1::uuid`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف مجموعه پادکست")
	}
	return nil
}
