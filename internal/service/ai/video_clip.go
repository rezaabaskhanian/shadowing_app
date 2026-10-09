package aiservice

import (
	"context"
	"encoding/json"
	"strings"
)

// ---------- تکمیل کلیپ ویدیویی (پنل ادمین) ----------

type VideoClipLineDraft struct {
	Speaker string `json:"speaker"`
	Text    string `json:"text"`
}

type VideoClipLineCompletion struct {
	Index         int    `json:"index"`
	Speaker       string `json:"speaker"`
	TranslationFa string `json:"translation_fa"`
}

type VideoClipQuestion struct {
	QuestionFa  string   `json:"question_fa"`
	Options     []string `json:"options"`
	AnswerIndex int      `json:"answer_index"`
}

type VideoClipCompletion struct {
	Lines     []VideoClipLineCompletion `json:"lines"`
	Questions []VideoClipQuestion       `json:"questions"`
}

const completeVideoClipPrompt = `You help an admin prepare a short video clip (a scene from a movie, or a short AI-generated scene) for an English speaking app for Persian speakers.
You get the clip title, an optional Persian description, the learner level, and the numbered dialogue lines in order (from speech-to-text; some may already have a speaker name, others have an empty speaker).

Do three things:
1. speaker: for each line keep the given speaker if not empty; otherwise infer who says it. Use real names if the dialogue or title reveals them (e.g. someone is addressed by name), otherwise use consistent short labels like "Man", "Woman", "Waiter", "Customer", "A", "B". The same person must always get exactly the same label. Consecutive lines are usually (not always) different speakers.
2. translation_fa: a natural, short, spoken-style Persian translation of each line (not word-for-word).
3. questions: 3 to 4 multiple-choice comprehension questions IN PERSIAN that check whether the learner understood what happens in the clip (gist and key details, not single-word trivia). Each has exactly 3 Persian options and answer_index (0-based) of the correct one. Vary the position of the correct answer.

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences.
- Schema:
{"lines": [{"index": number, "speaker": string, "translation_fa": string}], "questions": [{"question_fa": string, "options": [string, string, string], "answer_index": number}]}
- Return exactly one entry in "lines" per input line, using the given index numbers.`

// CompleteVideoClip گوینده‌ی خطوطِ بی‌گوینده، ترجمه‌ی فارسی و سؤال‌های فهم کلیپ را پیشنهاد می‌دهد.
func (s Service) CompleteVideoClip(ctx context.Context, title, descriptionFa, level string, lines []VideoClipLineDraft) (VideoClipCompletion, error) {
	type numbered struct {
		Index   int    `json:"index"`
		Speaker string `json:"speaker"`
		Text    string `json:"text"`
	}
	in := make([]numbered, 0, len(lines))
	for i, l := range lines {
		in = append(in, numbered{Index: i, Speaker: strings.TrimSpace(l.Speaker), Text: strings.TrimSpace(l.Text)})
	}
	input, _ := json.Marshal(map[string]any{
		"title":          title,
		"description_fa": descriptionFa,
		"level":          level,
		"lines":          in,
	})
	var out VideoClipCompletion
	_, err := s.completeJSON(ctx, "aiservice.CompleteVideoClip", completeVideoClipPrompt, string(input), &out)
	return out, err
}
