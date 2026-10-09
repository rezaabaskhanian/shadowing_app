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
You get a topic and/or the context of a scene from the app (its title and dialogue lines), the learner level, and a target length in minutes.

The episode should:
- Open with a short warm greeting and say what today's episode is about.
- If a scene is given: talk about the situation in that scene, explain 4-6 of its most useful phrases in simple English with natural examples, share a tip or a common mistake, maybe a short role-play of 2-4 lines.
- If only a topic is given: discuss it in an engaging, everyday way, naturally teaching useful phrases.
- Use language matched to the level (beginner = short simple sentences, slow pace, common words; advanced = natural speed and idioms). Each line 1-3 sentences.
- Close with a short recap of the key phrases and a friendly goodbye that encourages the listener to practise speaking.
- Roughly 130 spoken words per minute in total for the target length.

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences.
- Schema:
{"title": string (short catchy English episode title), "description_fa": string (1-2 Persian sentences: what the listener will learn), "lines": [{"speaker": "{HOST_A}" or "{HOST_B}", "text": string, "translation_fa": string (natural Persian translation)}], "vocabulary": [{"word": string (a key word or phrase from the episode), "meaning_fa": string}]}
- vocabulary: 5-8 items.
- No stage directions, sound effects or emojis in "text" — it is read aloud by text-to-speech.`

// PodcastHosts نام دو مجری پیش‌فرض (اولی زن، دومی مرد) — صدای TTS بر همین اساس انتخاب می‌شود.
var PodcastHosts = [2]string{"Emma", "Sam"}

// GeneratePodcastScript متن یک قسمت پادکست را از موضوع و/یا صحنه می‌نویسد.
func (s Service) GeneratePodcastScript(ctx context.Context, topic, sceneContext, level string, minutes int) (PodcastScript, error) {
	prompt := strings.NewReplacer("{HOST_A}", PodcastHosts[0], "{HOST_B}", PodcastHosts[1]).Replace(podcastScriptPrompt)
	input, _ := json.Marshal(map[string]any{
		"topic":          strings.TrimSpace(topic),
		"scene":          strings.TrimSpace(sceneContext),
		"level":          level,
		"target_minutes": minutes,
	})
	var out PodcastScript
	_, err := s.completeJSON(ctx, "aiservice.GeneratePodcastScript", prompt, string(input), &out)
	return out, err
}
