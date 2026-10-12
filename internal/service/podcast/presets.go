package podcastservice

import (
	"context"
	"encoding/json"

	"shadowing-backend/internal/pkg/richerror"
)

// KeyLevelPresets تنظیماتِ پیش‌فرضِ هر سطح (JSON) در app_settings؛ از پنل
// ادمین عوض می‌شود. نبودِ آن = DefaultLevelPresets.
const KeyLevelPresets = "PODCAST_LEVEL_PRESETS"

// LevelPreset پیش‌فرض‌های ساختِ پادکست برای یک سطح. موقعِ ساخت در پنل پر
// می‌شوند و برای همان پادکست قابل تغییرند.
type LevelPreset struct {
	MaxWordsPerSentence int     `json:"max_words_per_sentence"` // ۰ = آزاد
	MinLines            int     `json:"min_lines"`
	MaxLines            int     `json:"max_lines"`
	NewVocab            int     `json:"new_vocab"`
	SpeechSpeed         float64 `json:"speech_speed"` // ۰٫۷ تا ۱٫۲
	LineGapMs           int     `json:"line_gap_ms"`
}

var Levels = []string{"starter", "beginner", "intermediate", "advanced"}

var DefaultLevelPresets = map[string]LevelPreset{
	"starter":      {MaxWordsPerSentence: 6, MinLines: 8, MaxLines: 10, NewVocab: 3, SpeechSpeed: 0.8, LineGapMs: 1500},
	"beginner":     {MaxWordsPerSentence: 10, MinLines: 12, MaxLines: 16, NewVocab: 5, SpeechSpeed: 0.9, LineGapMs: 1000},
	"intermediate": {MaxWordsPerSentence: 15, MinLines: 18, MaxLines: 22, NewVocab: 8, SpeechSpeed: 1, LineGapMs: 500},
	"advanced":     {MaxWordsPerSentence: 0, MinLines: 24, MaxLines: 30, NewVocab: 10, SpeechSpeed: 1, LineGapMs: 300},
}

type settingsStore interface {
	Get(key string) string
	Set(ctx context.Context, key, value string) error
}

func clampFloat(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func clampInt(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

// normalize مقادیرِ نامعقول را به بازه‌ی مجاز می‌برد.
func (p LevelPreset) normalize() LevelPreset {
	if p.MaxWordsPerSentence != 0 {
		p.MaxWordsPerSentence = clampInt(p.MaxWordsPerSentence, 3, 40)
	}
	p.MinLines = clampInt(p.MinLines, 4, 60)
	p.MaxLines = clampInt(p.MaxLines, p.MinLines, 60)
	p.NewVocab = clampInt(p.NewVocab, 0, 15)
	p.SpeechSpeed = clampFloat(p.SpeechSpeed, 0.7, 1.2)
	p.LineGapMs = clampInt(p.LineGapMs, 0, 3000)
	return p
}

// LevelPresets پیش‌فرض‌های فعلی (ذخیره‌شده در تنظیمات، وگرنه پیش‌فرضِ کد).
func (s *Service) LevelPresets() map[string]LevelPreset {
	out := map[string]LevelPreset{}
	for k, v := range DefaultLevelPresets {
		out[k] = v
	}
	if s.settings == nil {
		return out
	}
	var saved map[string]LevelPreset
	if raw := s.settings.Get(KeyLevelPresets); raw != "" && json.Unmarshal([]byte(raw), &saved) == nil {
		for _, lvl := range Levels {
			if p, ok := saved[lvl]; ok {
				out[lvl] = p.normalize()
			}
		}
	}
	return out
}

func (s *Service) AdminSaveLevelPresets(ctx context.Context, presets map[string]LevelPreset) (map[string]LevelPreset, error) {
	const op = "podcast.AdminSaveLevelPresets"
	if s.settings == nil {
		return nil, richerror.New(op).WithMessage("تنظیمات در دسترس نیست")
	}
	clean := map[string]LevelPreset{}
	for _, lvl := range Levels {
		if p, ok := presets[lvl]; ok {
			clean[lvl] = p.normalize()
		}
	}
	raw, _ := json.Marshal(clean)
	if err := s.settings.Set(ctx, KeyLevelPresets, string(raw)); err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی تنظیمات سطح‌ها")
	}
	return s.LevelPresets(), nil
}
