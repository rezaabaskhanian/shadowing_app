package aiservice

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

// ---------- پیشنهاد معناهای یک فعل (پنل ادمین) ----------

type VerbMeaningSuggestion struct {
	MeaningFa        string `json:"meaning_fa"`
	ExplanationFa    string `json:"explanation_fa"`
	Example          string `json:"example"`
	PracticePromptFa string `json:"practice_prompt_fa"`
}

const suggestVerbMeaningsPrompt = `You help build an English-learning app for Persian speakers. Given one common English verb, list its most useful distinct meanings for everyday spoken English (6 to 10), including its most common phrasal verbs as separate meanings (e.g. for "get": "get up", "get over").

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences.
- Schema:
{"meanings": [{
  "meaning_fa": string (short Persian meaning, 1-4 words, e.g. "رسیدن"),
  "explanation_fa": string (one short Persian sentence explaining when this meaning is used; for a phrasal verb, name it, e.g. "get over: از چیزی عبور کردن / خوب شدن"),
  "example": string (one natural, short English example sentence using this meaning),
  "practice_prompt_fa": string (a short Persian situation that makes the learner produce this meaning in one spoken sentence, written as an instruction, e.g. "به دوستت بگو ساعت چند به فرودگاه رسیدی.")
}]}
- Order meanings from most to least common.`

// SuggestVerbMeanings فهرست پیشنهادی معناهای یک فعل را برای ادمین می‌سازد.
func (s Service) SuggestVerbMeanings(ctx context.Context, verb string) ([]VerbMeaningSuggestion, error) {
	var out struct {
		Meanings []VerbMeaningSuggestion `json:"meanings"`
	}
	_, err := s.completeJSON(ctx, "aiservice.SuggestVerbMeanings", suggestVerbMeaningsPrompt, "Verb: "+strings.TrimSpace(verb), &out)
	return out.Meanings, err
}

// ---------- تشخیص معنای فعل در جمله‌های درس‌ها (پنل ادمین) ----------

// VerbUsageClassification - برای جمله‌ی شماره‌ی Index: MeaningIndex شماره‌ی معنا
// در لیست ورودی است، یا -1 اگر کلمه آن‌جا به‌عنوان این فعل به کار نرفته
// (مثلاً "get-together" یا اسم) یا با هیچ‌کدام از معناها جور نیست.
type VerbUsageClassification struct {
	Index        int `json:"index"`
	MeaningIndex int `json:"meaning_index"`
}

const classifyVerbUsagesPrompt = `You classify how an English verb is used in sentences from an English-learning app.
You get the verb, a numbered list of its meanings (in Persian, with a short explanation), and numbered sentences that contain a form of the verb.

For each sentence decide which meaning the verb has there. Use -1 if the word is not used as this verb in that sentence (e.g. it is part of a noun like "get-together") or if none of the listed meanings fits.

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences.
- Schema: {"results": [{"index": number, "meaning_index": number}]}
- Return exactly one result per sentence, using the sentence numbers given.`

// ClassifyVerbUsages برای هر جمله معنای فعل را از بین meanings حدس می‌زند.
// meanings: هر آیتم «معنا — توضیح».
func (s Service) ClassifyVerbUsages(ctx context.Context, verb string, meanings, sentences []string) ([]VerbUsageClassification, error) {
	var b strings.Builder
	fmt.Fprintf(&b, "Verb: %s\n\nMeanings:\n", verb)
	for i, m := range meanings {
		fmt.Fprintf(&b, "%d. %s\n", i, m)
	}
	b.WriteString("\nSentences:\n")
	for i, sentence := range sentences {
		fmt.Fprintf(&b, "%d. %s\n", i, sentence)
	}

	var out struct {
		Results []VerbUsageClassification `json:"results"`
	}
	_, err := s.completeJSON(ctx, "aiservice.ClassifyVerbUsages", classifyVerbUsagesPrompt, b.String(), &out)
	return out.Results, err
}

// ---------- بررسی جمله‌ی گفته‌شده‌ی کاربر (تمرین صوتی) ----------

type VerbUsageCheck struct {
	UsedVerb       bool       `json:"used_verb"`
	CorrectMeaning bool       `json:"correct_meaning"`
	Grammatical    bool       `json:"grammatical"`
	FeedbackFa     string     `json:"feedback_fa"`
	BetterSentence string     `json:"better_sentence"`
	Usage          TokenUsage `json:"-"`
}

const checkVerbUsagePrompt = `You check one spoken English sentence from a Persian-speaking learner in a speaking-practice app.
The learner was given a situation (in Persian) and asked to say ONE sentence that uses a specific English verb with a specific meaning. You get the verb, the target meaning (Persian), the situation, and a speech-to-text transcript of what they said (may contain small recognition errors — be lenient about those).

Judge:
- used_verb: did they use any form of the verb (including the phrasal verb if the meaning is a phrasal verb)?
- correct_meaning: is the verb used with the target meaning?
- grammatical: is the sentence acceptable spoken English (ignore punctuation/capitalization)?

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences.
- Schema:
{
  "used_verb": boolean,
  "correct_meaning": boolean,
  "grammatical": boolean,
  "feedback_fa": string (one short, encouraging Persian sentence: what was good, or the single most important fix),
  "better_sentence": string (a natural English sentence for this situation using the verb with the target meaning; if theirs was already natural, a slightly more natural variant)
}
- If the transcript is empty or unintelligible, all three are false.`

// CheckVerbUsage جمله‌ی گفته‌شده‌ی کاربر را برای یک معنای مشخص از فعل بررسی می‌کند.
func (s Service) CheckVerbUsage(ctx context.Context, verb, meaningFa, situationFa, transcript string) (VerbUsageCheck, error) {
	input, _ := json.Marshal(map[string]string{
		"verb":       verb,
		"meaning":    meaningFa,
		"situation":  situationFa,
		"transcript": strings.TrimSpace(transcript),
	})
	var out VerbUsageCheck
	usage, err := s.completeJSON(ctx, "aiservice.CheckVerbUsage", checkVerbUsagePrompt, string(input), &out)
	out.Usage = usage
	return out, err
}
