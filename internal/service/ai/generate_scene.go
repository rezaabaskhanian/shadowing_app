package aiservice

import "strings"

// ---- شکل خروجیِ تولیدشده (کلیدهای JSON با فرم پنل ادمین یکی است) ----

type GeneratedWord struct {
	Word    string `json:"word"`
	Meaning string `json:"meaning"`
}

type GeneratedDialogue struct {
	Order        int             `json:"order"`
	Speaker      string          `json:"speaker"` // customer | clerk | npc
	OriginalText string          `json:"original_text"`
	Translation  string          `json:"translation"`
	DisplayType  string          `json:"display_type"` // full | partial | none
	WaitDuration int             `json:"wait_duration"`
	Words        []GeneratedWord `json:"words"`
}

type GeneratedHotspot struct {
	Name      string              `json:"name"`
	XPosition float64             `json:"x_position"` // 0..100
	YPosition float64             `json:"y_position"` // 0..100
	Order     int                 `json:"order"`
	Dialogues []GeneratedDialogue `json:"dialogues"`
}

// GeneratedGrammarExample یک مثالِ نکته‌ی گرامری است. مدل فقط HotspotOrder و
// DialogueOrder (ارجاع به یک خطِ واقعیِ همین صحنه) را می‌دهد؛ Text و Translation
// را خودِ سرور از همان دیالوگ پر می‌کند (resolveGrammarNote) تا مثال هیچ‌وقت
// جمله‌ی ساختگیِ مدل نباشد.
type GeneratedGrammarExample struct {
	HotspotOrder  int    `json:"hotspot_order"`
	DialogueOrder int    `json:"dialogue_order"`
	Text          string `json:"text,omitempty"`
	Translation   string `json:"translation,omitempty"`
}

// GeneratedGrammarNote توضیحِ فارسیِ کوتاه و مثال‌های نکته‌ی گرامریِ صحنه؛ فقط
// وقتی ادمین موضوعی داده باشد پر می‌شود.
type GeneratedGrammarNote struct {
	ExplanationFA string                    `json:"explanation_fa"`
	Examples      []GeneratedGrammarExample `json:"examples"`
}

type GeneratedScene struct {
	Title       string                `json:"title"`
	Description string                `json:"description"`
	Difficulty  string                `json:"difficulty"` // beginner | intermediate | advanced
	ImagePrompt string                `json:"image_prompt"`
	Hotspots    []GeneratedHotspot    `json:"hotspots"`
	GrammarNote *GeneratedGrammarNote `json:"grammar_note,omitempty"`
}

// maxGrammarExamples سقفِ تعداد مثال‌ها (هم‌راستا با scene.MaxGrammarExamples؛
// پکیج ai به دامین وابسته نیست).
const maxGrammarExamples = 4

// grammarFocusPrefix خطی است که موضوع گرامری را داخل پرامپتِ کاربر می‌گذارد و
// sceneSystemPrompt به آن ارجاع می‌دهد.
const grammarFocusPrefix = "Grammar focus for this scene:"

// sceneSystemPrompt هم برای Claude و هم برای Gemini استفاده می‌شود تا خروجی هر دو
// ارائه‌دهنده دقیقاً با یک اسکیمای JSON مطابقت داشته باشد.
const sceneSystemPrompt = `You generate content for an English-conversation "shadowing" learning app.
Given a short situation prompt (in Persian or English), produce a realistic scene with 2-3 hotspots (interaction points) and, for each hotspot, a natural back-and-forth dialogue.

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences, no commentary.
- Match this exact schema:
{
  "title": string (short English title),
  "description": string (one short English sentence),
  "difficulty": "beginner" | "intermediate" | "advanced",
  "image_prompt": string (a short English prompt to generate a cartoon-style background image of this place),
  "hotspots": [
    {
      "name": string (short English label for the spot, e.g. "Counter"),
      "x_position": number 0-100 (horizontal % on the image),
      "y_position": number 0-100 (vertical % on the image),
      "order": number (1-based),
      "dialogues": [
        {
          "order": number (1-based within the hotspot),
          "speaker": string (role of speaker, e.g. "customer", "clerk", "doctor", "patient", "passenger", "receptionist", "teacher", "friend", etc.),
          "original_text": string (natural spoken English, short),
          "translation": string (accurate Persian translation),
          "display_type": "full",
          "wait_duration": 5,
          "words": [ { "word": string (lowercase English key word from this line), "meaning": string (Persian meaning) } ]
        }
      ]
    }
  ]
}

Guidance:
- 4-8 dialogues per hotspot, alternating speakers, forming a coherent conversation.
- Keep sentences simple and useful for a language learner; match the requested difficulty.
- For "words", pick 1-3 important content words from each line (skip trivial words like "the", "is").
- Spread hotspot x/y positions across the image (roughly 20-80).
- Persian translations must be accurate and natural.

Grammar focus (ONLY when the request contains a line starting with "Grammar focus for this scene:"):
- Write the dialogues so that this grammar point is used naturally in at least 4 different lines, at a level that fits the difficulty.
- In addition to the schema above, add a top-level key "grammar_note" to the JSON object:
  "grammar_note": {
    "explanation_fa": string (2-4 short, simple sentences in Persian explaining what the grammar point is and when to use it; short English fragments are fine),
    "examples": [ { "hotspot_order": number, "dialogue_order": number } ]
  }
- "examples" must contain 2 to 4 references to lines you wrote that clearly use the grammar point. "hotspot_order" and "dialogue_order" must exactly match the "order" of an existing hotspot and of a dialogue inside it. Do NOT write sentences there, only references.
- If the request has no "Grammar focus for this scene:" line, do not include "grammar_note".`

// extractJSON اولین شیء JSON را از متن بیرون می‌کشد (اگر مدل fence یا متن اضافه گذاشت).
func extractJSON(text string) string {
	t := strings.TrimSpace(text)
	t = strings.TrimPrefix(t, "```json")
	t = strings.TrimPrefix(t, "```")
	t = strings.TrimSuffix(t, "```")
	start := strings.Index(t, "{")
	end := strings.LastIndex(t, "}")
	if start >= 0 && end > start {
		return t[start : end+1]
	}
	return t
}

// resolveGrammarNote ارجاع‌های مثال‌ها (hotspot_order/dialogue_order) را به متنِ
// واقعیِ همان دیالوگ‌ها تبدیل می‌کند و ارجاع‌های نامعتبر یا تکراری را حذف می‌کند.
// اگر مدل جمله‌ای ساخته یا شماره‌ی اشتباه داده باشد، آن مثال کنار گذاشته می‌شود —
// ادمین قبل از ذخیره نتیجه را می‌بیند و می‌تواند کم‌وکاست را دستی پر کند.
func resolveGrammarNote(scene *GeneratedScene) {
	note := scene.GrammarNote
	if note == nil {
		return
	}
	note.ExplanationFA = strings.TrimSpace(note.ExplanationFA)

	seen := map[[2]int]bool{}
	resolved := make([]GeneratedGrammarExample, 0, maxGrammarExamples)
	for _, ref := range note.Examples {
		key := [2]int{ref.HotspotOrder, ref.DialogueOrder}
		if seen[key] {
			continue
		}
		text, translation, ok := findDialogueLine(scene.Hotspots, ref.HotspotOrder, ref.DialogueOrder)
		if !ok {
			continue
		}
		seen[key] = true
		resolved = append(resolved, GeneratedGrammarExample{
			HotspotOrder:  ref.HotspotOrder,
			DialogueOrder: ref.DialogueOrder,
			Text:          text,
			Translation:   translation,
		})
		if len(resolved) == maxGrammarExamples {
			break
		}
	}
	note.Examples = resolved

	if note.ExplanationFA == "" && len(resolved) == 0 {
		scene.GrammarNote = nil
	}
}

// findDialogueLine دیالوگی را که hotspot و dialogue با order داده‌شده دارد پیدا می‌کند.
func findDialogueLine(hotspots []GeneratedHotspot, hotspotOrder, dialogueOrder int) (text, translation string, ok bool) {
	for _, h := range hotspots {
		if h.Order != hotspotOrder {
			continue
		}
		for _, d := range h.Dialogues {
			if d.Order == dialogueOrder && strings.TrimSpace(d.OriginalText) != "" {
				return strings.TrimSpace(d.OriginalText), strings.TrimSpace(d.Translation), true
			}
		}
	}
	return "", "", false
}
