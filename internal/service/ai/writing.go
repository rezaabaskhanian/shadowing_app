package aiservice

import (
	"context"
	"encoding/json"
	"strings"
)

// ---------- تصحیح متن/داستان کوتاه کاربر ----------

type WritingStructure struct {
	Structure string `json:"structure"`
	Example   string `json:"example"`
	NoteFa    string `json:"note_fa"`
}

type WritingReview struct {
	OnTopic         string               `json:"on_topic"` // "yes" | "partial" | "no"
	Score           int                  `json:"score"`    // 0..100
	SummaryFa       string               `json:"summary_fa"`
	StrengthsFa     []string             `json:"strengths_fa"`
	Mistakes        []TopicSpeechMistake `json:"mistakes"`
	BetterPhrases   []TopicSpeechPhrase  `json:"better_phrases"`
	Structures      []WritingStructure   `json:"structures"`
	UsedPhrases     []string             `json:"used_phrases"`
	ImprovedVersion string               `json:"improved_version"`
	Usage           TokenUsage           `json:"-"`
}

const reviewWritingPrompt = `You are a warm, encouraging English writing teacher for Persian-speaking learners.
The learner wrote a short story/text about a given topic. You get the topic, the Persian instruction they saw, optional guide questions, optional suggested phrases/structures, their level, and their text.

Review it:
- on_topic: "yes", "partial" (drifted or too short), or "no".
- score: 0-100 for THEIR level (beginner judged more gently): staying on topic, enough content, grammar, vocabulary, sentence variety, spelling. Empty or nonsense text is 0.
- summary_fa: 1-2 short, encouraging Persian sentences: overall impression and the single most important next step.
- strengths_fa: up to 3 short Persian points of what they did well.
- mistakes: up to 6 of the MOST important real mistakes (grammar, tense, articles, prepositions, word choice, spelling): the learner's original phrase (copied exactly from their text), the corrected phrase, and a short Persian explanation of the grammar rule, like a kind teacher (e.g. "بعد از yesterday فعل باید گذشته باشد: went نه go"). Empty list if there are no real mistakes.
- better_phrases: up to 4 ways to sound more natural or richer: a simple phrase they used ("instead_of", copied from their text), a better alternative ("try"), and a short Persian note.
- structures: 2-3 grammar structures or linking patterns they did NOT use but should try in this kind of story, each with the structure (e.g. "When I was ..., I ..." or "First ..., then ..., finally ..."), a short example sentence that fits THEIR story, and a short Persian note on when to use it. Prefer the suggested phrases of the topic when they fit.
- used_phrases: which of the suggested phrases (exact strings from the given list) they actually used. Empty list if none or no list was given.
- improved_version: their text rewritten as natural, correct English, keeping THEIR ideas and roughly their length, at a level just slightly above theirs (no new ideas). Empty string if the text is empty.

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences.
- Schema:
{"on_topic": string, "score": number, "summary_fa": string, "strengths_fa": [string], "mistakes": [{"original": string, "corrected": string, "explanation_fa": string}], "better_phrases": [{"instead_of": string, "try": string, "note_fa": string}], "structures": [{"structure": string, "example": string, "note_fa": string}], "used_phrases": [string], "improved_version": string}`

// ReviewWriting متن کوتاه کاربر درباره‌ی یک موضوع را تصحیح می‌کند.
func (s Service) ReviewWriting(ctx context.Context, title, promptFa string, guideQuestions, usefulPhrases []string, level, text string) (WritingReview, error) {
	input, _ := json.Marshal(map[string]any{
		"topic":             title,
		"instruction_fa":    promptFa,
		"guide_questions":   guideQuestions,
		"suggested_phrases": usefulPhrases,
		"level":             level,
		"text":              strings.TrimSpace(text),
	})
	var out WritingReview
	usage, err := s.completeJSON(ctx, "aiservice.ReviewWriting", reviewWritingPrompt, string(input), &out)
	out.Usage = usage
	return out, err
}

const suggestWritingPromptPrompt = `You help an admin create a "write a short story/text" exercise in an English app for Persian speakers.
You get a short idea (Persian or English) and the learner level. Produce the exercise content.

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences.
- Schema:
{
  "title": string (short English title, e.g. "A day I will never forget"),
  "prompt_fa": string (1-2 friendly Persian sentences telling the learner what to write, e.g. "داستان روزی را بنویس که هیچ‌وقت فراموشش نمی‌کنی: کجا بودی، چه اتفاقی افتاد و چه حسی داشتی."),
  "guide_questions": [string] (4-6 short, simple English questions that help them build the story in order),
  "useful_phrases": [string] (4-6 English phrases, linking words or sentence structures useful for this story at this level, e.g. "One day, ...", "Suddenly, ...", "In the end, ...")
}
- Match vocabulary and grammar to the level: beginner = very simple past/present, short sentences.`

// SuggestWritingPrompt از یک ایده‌ی کوتاه، محتوای کامل یک موضوع نوشتن را پیشنهاد می‌دهد.
func (s Service) SuggestWritingPrompt(ctx context.Context, idea, level string) (SpeakingTopicSuggestion, error) {
	input, _ := json.Marshal(map[string]string{"idea": strings.TrimSpace(idea), "level": level})
	var out SpeakingTopicSuggestion
	_, err := s.completeJSON(ctx, "aiservice.SuggestWritingPrompt", suggestWritingPromptPrompt, string(input), &out)
	return out, err
}
