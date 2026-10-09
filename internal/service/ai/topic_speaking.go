package aiservice

import (
	"context"
	"encoding/json"
	"strings"
)

// ---------- بررسی صحبت ۱ تا ۲ دقیقه‌ای کاربر درباره‌ی یک موضوع ----------

type TopicSpeechMistake struct {
	Original      string `json:"original"`
	Corrected     string `json:"corrected"`
	ExplanationFa string `json:"explanation_fa"`
}

type TopicSpeechPhrase struct {
	InsteadOf string `json:"instead_of"`
	Try       string `json:"try"`
	NoteFa    string `json:"note_fa"`
}

type TopicSpeechReview struct {
	OnTopic         string               `json:"on_topic"` // "yes" | "partial" | "no"
	Score           int                  `json:"score"`    // 0..100
	SummaryFa       string               `json:"summary_fa"`
	StrengthsFa     []string             `json:"strengths_fa"`
	Mistakes        []TopicSpeechMistake `json:"mistakes"`
	BetterPhrases   []TopicSpeechPhrase  `json:"better_phrases"`
	UsedPhrases     []string             `json:"used_phrases"`
	ImprovedVersion string               `json:"improved_version"`
	Usage           TokenUsage           `json:"-"`
}

const reviewTopicSpeechPrompt = `You are a warm, encouraging English speaking coach for Persian-speaking learners in a speaking-practice app.
The learner was given a topic and spoke about it for 1-2 minutes. You get the topic, the Persian instruction they saw, optional guide questions, optional suggested phrases, their level, how long they spoke, and a speech-to-text transcript (it may contain small recognition errors and no punctuation — be lenient about those, never count them as mistakes).

Review what they said:
- on_topic: did they talk about the topic? "yes", "partial" (drifted or very short), or "no".
- score: 0-100 overall speaking-content score for THEIR level (beginner is judged more gently): staying on topic, enough content, grammar, vocabulary range. An empty or unintelligible transcript is 0.
- summary_fa: 1-2 short, encouraging Persian sentences: overall impression and the single most important next step.
- strengths_fa: up to 3 short Persian bullet points of what they did well.
- mistakes: up to 5 of the MOST important real grammar/word-choice mistakes, each with the learner's original phrase (copied from the transcript), the corrected phrase, and a short Persian explanation of the rule (like a kind teacher, e.g. "برای کاری که دیروز تمام شده از گذشته‌ی ساده استفاده کن: went"). Skip fillers, hesitations, and recognition artifacts. Empty list if there are no real mistakes.
- better_phrases: up to 4 suggestions to sound more natural or use richer vocabulary/structures: a simple phrase they used ("instead_of", copied from the transcript), a better alternative ("try"), and a short Persian note on when to use it. Prefer the suggested phrases of the topic when they fit.
- used_phrases: which of the suggested phrases (exact strings from the given list) they actually used. Empty list if none or no list was given.
- improved_version: their talk rewritten as natural, correct spoken English, keeping THEIR ideas and roughly their length, at a level just slightly above theirs (do not add new ideas). Empty string if the transcript is empty.

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences.
- Schema:
{"on_topic": string, "score": number, "summary_fa": string, "strengths_fa": [string], "mistakes": [{"original": string, "corrected": string, "explanation_fa": string}], "better_phrases": [{"instead_of": string, "try": string, "note_fa": string}], "used_phrases": [string], "improved_version": string}`

// ReviewTopicSpeech صحبت کاربر درباره‌ی یک موضوع را بررسی می‌کند.
func (s Service) ReviewTopicSpeech(ctx context.Context, title, promptFa string, guideQuestions, usefulPhrases []string, level string, durationSeconds int, transcript string) (TopicSpeechReview, error) {
	input, _ := json.Marshal(map[string]any{
		"topic":             title,
		"instruction_fa":    promptFa,
		"guide_questions":   guideQuestions,
		"suggested_phrases": usefulPhrases,
		"level":             level,
		"spoke_seconds":     durationSeconds,
		"transcript":        strings.TrimSpace(transcript),
	})
	var out TopicSpeechReview
	usage, err := s.completeJSON(ctx, "aiservice.ReviewTopicSpeech", reviewTopicSpeechPrompt, string(input), &out)
	out.Usage = usage
	return out, err
}

// ---------- پیشنهاد محتوای یک موضوع (پنل ادمین) ----------

type SpeakingTopicSuggestion struct {
	Title          string   `json:"title"`
	PromptFa       string   `json:"prompt_fa"`
	GuideQuestions []string `json:"guide_questions"`
	UsefulPhrases  []string `json:"useful_phrases"`
}

const suggestSpeakingTopicPrompt = `You help an admin create a "speak about a topic for 1-2 minutes" exercise in an English speaking app for Persian speakers.
You get a short idea (Persian or English) and the learner level. Produce the exercise content.

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences.
- Schema:
{
  "title": string (short English topic title, e.g. "My best trip"),
  "prompt_fa": string (1-2 Persian sentences telling the learner what to talk about, friendly, e.g. "درباره‌ی بهترین سفری که رفتی صحبت کن: کجا رفتی، با کی، و چه چیزی برایت جالب بود."),
  "guide_questions": [string] (4-6 short, simple English questions that help them keep talking, ordered like a story),
  "useful_phrases": [string] (4-6 English phrases or sentence structures useful for this topic at this level, e.g. "Last summer, I went to ...", "The best part was ...")
}
- Match vocabulary and grammar to the level: beginner = very simple present/past, short sentences.`

// SuggestSpeakingTopic از یک ایده‌ی کوتاه، محتوای کامل یک موضوع را پیشنهاد می‌دهد.
func (s Service) SuggestSpeakingTopic(ctx context.Context, idea, level string) (SpeakingTopicSuggestion, error) {
	input, _ := json.Marshal(map[string]string{"idea": strings.TrimSpace(idea), "level": level})
	var out SpeakingTopicSuggestion
	_, err := s.completeJSON(ctx, "aiservice.SuggestSpeakingTopic", suggestSpeakingTopicPrompt, string(input), &out)
	return out, err
}
