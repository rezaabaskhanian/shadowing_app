package aiservice

import (
	"context"
	"encoding/json"
	"strings"
)

// ---------- نوشتن متن پادکست (پنل ادمین) ----------

type PodcastLineSuggestion struct {
	Speaker       string `json:"speaker"`
	Text          string `json:"text"`
	TranslationFa string `json:"translation_fa"`
}

type PodcastVocabSuggestion struct {
	Word      string `json:"word"`
	MeaningFa string `json:"meaning_fa"`
}

type PodcastScript struct {
	Title         string                   `json:"title"`
	DescriptionFa string                   `json:"description_fa"`
	Lines         []PodcastLineSuggestion  `json:"lines"`
	Vocabulary    []PodcastVocabSuggestion `json:"vocabulary"`
}

const podcastScriptPrompt = `You write a short, friendly English-learning podcast episode for Persian-speaking learners of a speaking app.
Two hosts talk naturally to each other (a real conversation, not a lecture): {HOST_A} (female) and {HOST_B} (male).
You get a topic and/or context: a scene from the app (its title and dialogue lines) and/or "source" — a lesson or scene file the admin prepared (JSON or text). Plus the learner level and difficulty limits.

The episode should:
- Open with a short warm greeting and say what today's episode is about.
- If a scene is given: talk about the situation in that scene, explain 4-6 of its most useful phrases in simple English with natural examples, share a tip or a common mistake, maybe a short role-play of 2-4 lines.
- If a source is given: build the episode around its situation, words and sentences — reuse its key phrases so the learner hears familiar material in a new conversation. Ignore technical fields (ids, urls, positions).
- If only a topic is given: discuss it in an engaging, everyday way, naturally teaching useful phrases.
- If style is "featured": this is NOT a lesson episode. Make it an entertaining general-interest show (a story, culture, travel, fun facts, everyday life abroad, ...) that a learner would enjoy just listening to. No "today we learn these phrases" framing and no role-play; the key phrases appear naturally in the talk and the recap is a light one-liner. Still match the level limits.
- Use language matched to the level: starter = absolute beginner, very short and simple sentences, the most common words, present tense, lots of repetition of the key phrases; beginner = short simple sentences, common words; intermediate = natural everyday English; advanced = natural speed and idioms.
- Respect the limits exactly: number of lines between min_lines and max_lines; when max_words_per_sentence > 0, no sentence may have more words than that (split long ideas into more lines instead). Each line 1-2 sentences (starter/beginner: 1 sentence).
- Close with a short recap of the key phrases and a friendly goodbye that encourages the listener to practise speaking.

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences.
- Schema:
{"title": string (short catchy English episode title), "description_fa": string (1-2 Persian sentences: what the listener will learn), "lines": [{"speaker": "{HOST_A}" or "{HOST_B}", "text": string, "translation_fa": string (natural Persian translation)}], "vocabulary": [{"word": string (a key word or phrase from the episode), "meaning_fa": string}]}
- vocabulary: exactly new_vocab items (the key words/phrases the episode teaches).
- No stage directions, sound effects or emojis in "text" — it is read aloud by text-to-speech.`

// PodcastHosts نام دو مجری پیش‌فرض (اولی زن، دومی مرد) — صدای TTS بر همین اساس انتخاب می‌شود.
var PodcastHosts = [2]string{"Emma", "Sam"}

// PodcastScriptInput موضوع/زمینه، سطح و محدودیت‌های سختی متن.
type PodcastScriptInput struct {
	Topic               string
	Scene               string
	Source              string
	Level               string
	MaxWordsPerSentence int
	MinLines            int
	MaxLines            int
	NewVocab            int
	// Featured پادکستِ «منتخب»: موضوعِ آزاد و جذاب، نه درس.
	Featured bool
}

// GeneratePodcastScript متن یک قسمت پادکست را از موضوع، صحنه و/یا منبع می‌نویسد.
func (s Service) GeneratePodcastScript(ctx context.Context, in PodcastScriptInput) (PodcastScript, error) {
	prompt := strings.NewReplacer("{HOST_A}", PodcastHosts[0], "{HOST_B}", PodcastHosts[1]).Replace(podcastScriptPrompt)
	input, _ := json.Marshal(map[string]any{
		"topic":                  strings.TrimSpace(in.Topic),
		"scene":                  strings.TrimSpace(in.Scene),
		"source":                 strings.TrimSpace(in.Source),
		"level":                  in.Level,
		"max_words_per_sentence": in.MaxWordsPerSentence,
		"min_lines":              in.MinLines,
		"max_lines":              in.MaxLines,
		"new_vocab":              in.NewVocab,
		"style":                  map[bool]string{true: "featured", false: "lesson"}[in.Featured],
	})
	var out PodcastScript
	_, err := s.completeJSON(ctx, "aiservice.GeneratePodcastScript", prompt, string(input), &out)
	return out, err
}
