package aiservice

import (
	"context"
	"encoding/json"
	"strings"
)

// ---------- ساخت کارت‌های یک درس دوره‌ی مبتدی (پنل ادمین) ----------

type CourseItemSuggestion struct {
	TextEn    string `json:"text_en"`
	MeaningFa string `json:"meaning_fa"`
	Emoji     string `json:"emoji"`
	TipFa     string `json:"tip_fa"`
}

type CourseLessonSuggestion struct {
	TitleEn string                 `json:"title_en"`
	GoalFa  string                 `json:"goal_fa"`
	Emoji   string                 `json:"emoji"`
	Items   []CourseItemSuggestion `json:"items"`
}

const suggestCourseLessonPrompt = `You design one lesson of a starter English course for ABSOLUTE beginners who are Persian speakers (teens/adults who know almost no English), taught the way you would teach young children: tiny steps, very common words, lots of repetition, friendly and confidence-building, and focused on SPEAKING (every card is something the learner will hear and then say out loud).

You get the lesson topic (Persian or English), optionally the unit it belongs to, the cards that already exist in earlier lessons (so you don't repeat them), and how many cards to make.

Make the cards:
- Start with single words, then 2-3 word phrases, and end with 1-2 very short, useful sentences that reuse the lesson's words (e.g. "red" → "a red apple" → "I like red.").
- Use only very high-frequency, concrete, easy-to-pronounce English. Max ~6 words per card.
- emoji: one emoji that pictures the card (helps memory, like a picture book).
- meaning_fa: short natural Persian meaning.
- tip_fa: one short, friendly Persian tip about pronouncing it (stress, a tricky sound like th/w/v, a silent letter) or when to use it. Empty string if there's nothing useful to say.

Also give:
- title_en: short English lesson title (e.g. "Colors").
- goal_fa: one short Persian sentence starting with "بعد از این درس می‌توانی ..." describing what they will be able to SAY.
- emoji: one emoji for the lesson.

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences.
- Schema: {"title_en": string, "goal_fa": string, "emoji": string, "items": [{"text_en": string, "meaning_fa": string, "emoji": string, "tip_fa": string}]}`

// SuggestCourseLesson کارت‌های یک درس دوره‌ی مبتدی را از روی موضوعش پیشنهاد می‌دهد.
func (s Service) SuggestCourseLesson(ctx context.Context, topic, unitTitle string, previousCards []string, count int) (CourseLessonSuggestion, error) {
	input, _ := json.Marshal(map[string]any{
		"topic":          strings.TrimSpace(topic),
		"unit":           unitTitle,
		"existing_cards": previousCards,
		"card_count":     count,
	})
	var out CourseLessonSuggestion
	_, err := s.completeJSON(ctx, "aiservice.SuggestCourseLesson", suggestCourseLessonPrompt, string(input), &out)
	return out, err
}
