package aiservice

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/anthropics/anthropic-sdk-go"
)

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

type GeneratedScene struct {
	Title       string             `json:"title"`
	Description string             `json:"description"`
	Difficulty  string             `json:"difficulty"` // beginner | intermediate | advanced
	ImagePrompt string             `json:"image_prompt"`
	Hotspots    []GeneratedHotspot `json:"hotspots"`
}

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
- Persian translations must be accurate and natural.`

// GenerateScene با یک پرامپت ساده، یک صحنه‌ی کامل (دیالوگ‌ها + ترجمه + واژه‌ها) می‌سازد.
func (s Service) GenerateScene(ctx context.Context, prompt, difficulty string) (GeneratedScene, error) {
	const op = "aiservice.GenerateScene"

	userText := fmt.Sprintf("Situation: %s", strings.TrimSpace(prompt))
	if difficulty != "" {
		userText += fmt.Sprintf("\nDifficulty: %s", difficulty)
	}

	resp, err := s.client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     s.model,
		MaxTokens: 8000,
		System: []anthropic.TextBlockParam{{
			Text: sceneSystemPrompt,
		}},
		Thinking: anthropic.ThinkingConfigParamUnion{
			OfAdaptive: &anthropic.ThinkingConfigAdaptiveParam{},
		},
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(userText)),
		},
	})
	if err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی: %v", err))
	}

	// متن نهایی را از بلاک‌های پاسخ جمع می‌کنیم (بلاک‌های thinking نادیده گرفته می‌شوند)
	var raw strings.Builder
	for _, block := range resp.Content {
		if b, ok := block.AsAny().(anthropic.TextBlock); ok {
			raw.WriteString(b.Text)
		}
	}

	jsonStr := extractJSON(raw.String())
	var scene GeneratedScene
	if err := json.Unmarshal([]byte(jsonStr), &scene); err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل قابل پردازش نبود")
	}

	if difficulty != "" {
		scene.Difficulty = difficulty
	}
	return scene, nil
}

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
