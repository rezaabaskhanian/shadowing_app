package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// قانون امنیتی این سرور: هیچ چیزی منتشر یا حذف نمی‌شود.
//   - ساخت‌ها همیشه پیش‌نویس‌اند (is_published / is_active = false).
//   - ویرایش‌ها وضعیت انتشارِ فعلی را دست نمی‌زنند.
//   - ابزارِ حذف، کاربر، اشتراک و پرداخت اصلاً وجود ندارد.
// انتشار با خود ادمین در پنل است.

type obj = map[string]any

func textResult(raw []byte) *mcp.CallToolResult {
	return &mcp.CallToolResult{Content: []mcp.Content{&mcp.TextContent{Text: string(raw)}}}
}

func jsonResult(v any) (*mcp.CallToolResult, any, error) {
	raw, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return nil, nil, err
	}
	return textResult(raw), nil, nil
}

func rawResult(raw []byte, err error) (*mcp.CallToolResult, any, error) {
	if err != nil {
		return nil, nil, err
	}
	return textResult(raw), nil, nil
}

func pathID(id string) (string, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return "", errors.New("id is required")
	}
	return url.PathEscape(id), nil
}

func days(d int) int {
	if d <= 0 {
		return 30
	}
	return d
}

// merge فیلدهای patch را روی current می‌نشاند (ویرایشِ جزئی).
func merge(current, patch obj) obj {
	out := obj{}
	for k, v := range current {
		out[k] = v
	}
	for k, v := range patch {
		out[k] = v
	}
	return out
}

func boolField(m obj, key string) bool {
	b, _ := m[key].(bool)
	return b
}

func str(m obj, key string) string {
	s, _ := m[key].(string)
	return s
}

// ---------- ورودی‌ها ----------

type noArgs struct{}

type idArg struct {
	ID string `json:"id" jsonschema:"the item id"`
}

type daysArg struct {
	Days int `json:"days,omitempty" jsonschema:"number of past days to report (default 30)"`
}

type sourceArg struct {
	Source string `json:"source" jsonschema:"absolute local file path, or an http(s) URL to download"`
}

type generateSceneArgs struct {
	Prompt       string `json:"prompt" jsonschema:"what the scene is about (any language)"`
	Difficulty   string `json:"difficulty" jsonschema:"starter | beginner | intermediate | advanced | proficient"`
	GrammarTopic string `json:"grammar_topic,omitempty" jsonschema:"optional grammar point to practise"`
}

type getSceneArgs struct {
	ID   string `json:"id" jsonschema:"scene id"`
	View string `json:"view,omitempty" jsonschema:"summary (default) | edit | full"`
}

type sceneArgs struct {
	FilePath string `json:"file_path,omitempty" jsonschema:"optional absolute path of a local JSON file with the full scene payload (used instead of scene; unknown keys such as description_fa are dropped by the server)"`
	Scene    obj    `json:"scene,omitempty" jsonschema:"full create-scene payload: title, description, background_image_url (may be empty for a draft), difficulty, category, is_locked, hotspots[{name,x_position,y_position,order,dialogues[{order,speaker,original_text,translation,audio_url,display_type,partial_hint,wait_duration,words[{word,meaning}],phrases[{phrase,meaning}]}]}], grammar_topic, grammar_explanation, grammar_examples, grammar_audio_url"`
}

type updateSceneArgs struct {
	ID    string `json:"id" jsonschema:"scene id"`
	Scene obj    `json:"scene" jsonschema:"full scene payload (same shape as create_scene_draft); the publish state is kept as it is"`
}

type sceneDifficultyArgs struct {
	ID         string `json:"id" jsonschema:"scene id"`
	Difficulty string `json:"difficulty" jsonschema:"starter | beginner | intermediate | advanced | proficient"`
}

type fillAudioArgs struct {
	ID           string            `json:"id" jsonschema:"scene id"`
	Voices       map[string]string `json:"voices,omitempty" jsonschema:"speaker name → voice_id"`
	DefaultVoice string            `json:"default_voice,omitempty" jsonschema:"voice for speakers not in voices (empty = provider default)"`
	Speed        float64           `json:"speed,omitempty" jsonschema:"0.7–1.2, 0 = default"`
	DryRun       bool              `json:"dry_run,omitempty" jsonschema:"only report what would be generated"`
}

type lineEdit struct {
	Hotspot     int    `json:"hotspot" jsonschema:"hotspot order, 1-based"`
	Line        int    `json:"line" jsonschema:"dialogue order inside the hotspot, 1-based"`
	OldText     string `json:"old_text" jsonschema:"current English text of that line (safety check; must match)"`
	Text        string `json:"text" jsonschema:"new English text"`
	Translation string `json:"translation" jsonschema:"new Persian translation"`
	Words       []obj  `json:"words,omitempty" jsonschema:"new vocab chips [{word, meaning}]; omitted = keep current"`
	Phrases     []obj  `json:"phrases,omitempty" jsonschema:"new phrase chips [{phrase, meaning}]; omitted = keep current"`
}

type getPathArgs struct {
	Level    string `json:"level" jsonschema:"path level, e.g. starter"`
	FilePath string `json:"file_path,omitempty" jsonschema:"optional absolute path: when set, the full path JSON is written to this file (ready to edit and pass to save_learning_path) and only a short summary is returned"`
}

type savePathArgs struct {
	Level    string `json:"level" jsonschema:"path level, e.g. starter"`
	FilePath string `json:"file_path" jsonschema:"absolute path of a local JSON file with the full path: {title_fa, description_fa, goal_fa, position, weeks:[{position,title_fa,goal_fa,can_do,is_free,sessions:[{no,title_fa,items:[{key,kind,ref_id,title,required}]}],checkpoint:{...}}]}"`
}

type checkpointAudioArgs struct {
	Level  string            `json:"level"`
	Voices map[string]string `json:"voices,omitempty" jsonschema:"dialogue speaker → voice_id, e.g. {\"A\":\"Kore\",\"B\":\"Puck\"}"`
}

type hotspotLayout struct {
	Order int     `json:"order" jsonschema:"hotspot order, 1-based"`
	X     float64 `json:"x" jsonschema:"x position in percent (0-100) of image width"`
	Y     float64 `json:"y" jsonschema:"y position in percent (0-100) of image height"`
	Name  string  `json:"name,omitempty" jsonschema:"new hotspot name; empty = keep"`
}

type sceneLayoutArgs struct {
	ID                 string          `json:"id" jsonschema:"scene id"`
	BackgroundImageURL string          `json:"background_image_url,omitempty" jsonschema:"uploaded image url (upload_image); empty = keep"`
	Hotspots           []hotspotLayout `json:"hotspots,omitempty"`
	AllowPublished     bool            `json:"allow_published,omitempty" jsonschema:"required for published scenes (saving regenerates dialogue ids)"`
}

type editLinesArgs struct {
	ID             string            `json:"id" jsonschema:"scene id"`
	Edits          []lineEdit        `json:"edits"`
	Voices         map[string]string `json:"voices,omitempty" jsonschema:"speaker name → voice_id for the new audio"`
	DefaultVoice   string            `json:"default_voice,omitempty"`
	Speed          float64           `json:"speed,omitempty"`
	AllowPublished bool              `json:"allow_published,omitempty" jsonschema:"required to edit a published scene (users lose per-dialogue progress and recordings)"`
}

type generateAudioArgs struct {
	Text    string  `json:"text" jsonschema:"English text to speak"`
	VoiceID string  `json:"voice_id,omitempty" jsonschema:"voice id from list_tts_voices (empty = default)"`
	Speed   float64 `json:"speed,omitempty" jsonschema:"0.7–1.2, 0 = default"`
}

type resourceArgs struct {
	ID       string `json:"id,omitempty" jsonschema:"set to update an existing resource; empty creates a new one"`
	Title    string `json:"title"`
	Kind     string `json:"kind" jsonschema:"lesson | scene | podcast | vocabulary | other"`
	Notes    string `json:"notes,omitempty"`
	FileName string `json:"file_name,omitempty"`
	Content  any    `json:"content,omitempty" jsonschema:"the JSON content; optional on update"`
}

type verbArgs struct {
	ID        string   `json:"id,omitempty" jsonschema:"set to update an existing verb; empty creates a new (unpublished) one"`
	Lemma     string   `json:"lemma" jsonschema:"base form, e.g. get"`
	Forms     []string `json:"forms,omitempty" jsonschema:"all inflected forms searched in dialogues, e.g. [get, gets, got, gotten, getting]"`
	SortOrder int      `json:"sort_order,omitempty"`
}

type verbMeaningArgs struct {
	VerbID           string `json:"verb_id" jsonschema:"the verb this meaning belongs to"`
	MeaningID        string `json:"meaning_id,omitempty" jsonschema:"set to update an existing meaning; empty creates a new one"`
	MeaningFa        string `json:"meaning_fa,omitempty" jsonschema:"short Persian meaning, 1–4 words (required for a new meaning; on update, empty fields keep their current value)"`
	ExplanationFa    string `json:"explanation_fa,omitempty"`
	FallbackExample  string `json:"fallback_example,omitempty" jsonschema:"English example shown until a lesson sentence is approved"`
	PracticePromptFa string `json:"practice_prompt_fa,omitempty" jsonschema:"Persian situation for the spoken practice"`
	Level            string `json:"level,omitempty" jsonschema:"CEFR level of this meaning (English Vocabulary Profile): A1 | A2 | B1 | B2 | C1 | C2"`
	SortOrder        int    `json:"sort_order,omitempty"`
}

type reviewOccurrenceArgs struct {
	ID        string `json:"id" jsonschema:"occurrence id (from get_verb)"`
	Status    string `json:"status" jsonschema:"approved | rejected | suggested"`
	MeaningID string `json:"meaning_id,omitempty" jsonschema:"meaning to attach (required when approving)"`
}

type reviewOccurrencesArgs struct {
	Items []reviewOccurrenceArgs `json:"items" jsonschema:"up to 200 reviews: {id, status, meaning_id}"`
}

type assessmentItemArgs struct {
	ID           string   `json:"id,omitempty" jsonschema:"set to update an existing item; empty creates a new one"`
	Kind         string   `json:"kind" jsonschema:"vocab_yesno | listen_choice | imitation | free_speech | shadow"`
	Category     string   `json:"category,omitempty" jsonschema:"free_speech only: intro | situational"`
	PromptText   string   `json:"prompt_text" jsonschema:"vocab: the word; listen_choice: the question shown (Persian); imitation: short instruction"`
	TargetText   string   `json:"target_text,omitempty" jsonschema:"listen_choice / imitation: the English sentence (never shown to the user)"`
	AudioURL     string   `json:"audio_url,omitempty" jsonschema:"listen_choice / imitation: audio of target_text (generate_audio)"`
	CEFR         string   `json:"cefr,omitempty" jsonschema:"listen_choice / imitation: A1 | A2 | B1 | B2 | C1"`
	Band         int      `json:"band,omitempty" jsonschema:"vocab_yesno: frequency band 1..5 (1 = most frequent 1000 words)"`
	IsPseudo     bool     `json:"is_pseudo,omitempty" jsonschema:"vocab_yesno: true for a made-up word"`
	Options      []string `json:"options,omitempty" jsonschema:"listen_choice: answer options (Persian)"`
	CorrectIndex int      `json:"correct_index,omitempty" jsonschema:"listen_choice: index of the right option"`
	IsActive     *bool    `json:"is_active,omitempty" jsonschema:"update only; default true"`
}

type assessmentItemsArgs struct {
	Items []assessmentItemArgs `json:"items" jsonschema:"items to create (no id) or update (with id), at most 150"`
}

type fixSceneTextArgs struct {
	SceneID            string `json:"scene_id" jsonschema:"scene id"`
	Translations       []obj  `json:"translations,omitempty" jsonschema:"[{dialogue_id, translation?, words?, phrases?}]: new Persian translation and/or the FULL replacement word/phrase chip arrays ([{word,meaning}] / [{phrase,meaning}]) of these dialogue lines (ids from get_scene)"`
	GrammarExamples    []obj  `json:"grammar_examples,omitempty" jsonschema:"FULL replacement grammar examples [{text, translation}] (empty = unchanged)"`
	GrammarTopic       string `json:"grammar_topic,omitempty" jsonschema:"new grammar note topic (empty = unchanged)"`
	GrammarExplanation string `json:"grammar_explanation,omitempty" jsonschema:"new grammar note explanation in Persian (empty = unchanged)"`
}

type goalPackArgs struct {
	Goal  string `json:"goal" jsonschema:"travel | migration | study | work"`
	Items []obj  `json:"items,omitempty" jsonschema:"save only: the WHOLE pack in order: {position, priority 1-3 (1 = most urgent), title_fa, title_en, scene_ids:[scene uuids, one per level]}; replaces the existing pack"`
}

type goalExtrasArgs struct {
	Goal  string `json:"goal" jsonschema:"travel | migration | study | work"`
	Items []obj  `json:"items,omitempty" jsonschema:"save only: the WHOLE list in order: {kind: podcast | topic | writing, ref_id: uuid, position}"`
}

type importIdiomsArgs struct {
	Items     []obj `json:"items" jsonschema:"idioms: {phrase, meaning_fa, explanation_fa, example_en, example_fa, level (CEFR A1–C2), category}"`
	Overwrite bool  `json:"overwrite,omitempty" jsonschema:"replace existing idioms with the same phrase (default false)"`
}

type podcastScriptArgs struct {
	Topic               string `json:"topic,omitempty"`
	Scene               string `json:"scene,omitempty" jsonschema:"setting/situation of the conversation"`
	Source              string `json:"source,omitempty" jsonschema:"source text (e.g. a library resource's content) to base the script on"`
	Level               string `json:"level" jsonschema:"starter | beginner | intermediate | advanced | proficient"`
	Kind                string `json:"kind,omitempty" jsonschema:"lesson (default) | featured"`
	MaxWordsPerSentence int    `json:"max_words_per_sentence,omitempty" jsonschema:"0 = level preset"`
	MinLines            int    `json:"min_lines,omitempty" jsonschema:"0 = level preset"`
	MaxLines            int    `json:"max_lines,omitempty" jsonschema:"0 = level preset"`
	NewVocab            int    `json:"new_vocab,omitempty" jsonschema:"0 = level preset"`
}

type podcastArgs struct {
	FilePath string `json:"file_path,omitempty" jsonschema:"optional absolute path of a local JSON file with the full podcast/story payload (used instead of podcast); the reply is then a short summary instead of the whole podcast"`
	Podcast  obj    `json:"podcast,omitempty" jsonschema:"podcast: title, description_fa, level, kind (lesson | featured | story), scene_id, vocabulary[{word,meaning_fa}], voices{speaker:voice_id}, speech_speed, line_gap_ms, images[{url,from_line}], image_url, lines[{position,speaker,text,translation_fa}]; for kind=story (a reading chapter, speaker Narrator): series_title, chapter_no, questions[{q,q_fa,options[],answer}]"`
}

type updateArgs struct {
	ID     string `json:"id"`
	Fields obj    `json:"fields" jsonschema:"only the fields to change; everything else is kept"`
}

type suggestTopicArgs struct {
	Idea  string `json:"idea"`
	Level string `json:"level" jsonschema:"starter | beginner | intermediate | advanced | proficient"`
}

type topicArgs struct {
	Topic obj `json:"topic" jsonschema:"speaking topic: title, prompt_fa, guide_questions[], useful_phrases[], level, duration_seconds, image_url, images[{url,caption}] (picture story)"`
}

type writingPromptArgs struct {
	Prompt obj `json:"prompt" jsonschema:"writing prompt: title, prompt_fa, guide_questions[], useful_phrases[], level (starter | beginner | intermediate | advanced | proficient), min_words, max_words, image_url"`
}

type detectLinesArgs struct {
	VideoURL string `json:"video_url" jsonschema:"url returned by upload_video"`
}

type completeClipArgs struct {
	Title         string `json:"title"`
	DescriptionFa string `json:"description_fa,omitempty"`
	Level         string `json:"level"`
	Lines         []obj  `json:"lines" jsonschema:"lines from detect_video_lines"`
}

type clipArgs struct {
	Clip obj `json:"clip" jsonschema:"video clip payload (same shape get_video_clip returns, without id)"`
}

// ---------- ثبت ابزارها ----------

func registerTools(s *mcp.Server, c *client) {
	ro := &mcp.ToolAnnotations{ReadOnlyHint: true}

	// ---- صحنه‌ها ----
	mcp.AddTool(s, &mcp.Tool{Name: "list_scenes", Annotations: ro,
		Description: "List all scenes (compact: id, title, difficulty, status, category, has_image, hotspot count; use get_scene for dialogues)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			var scenes []obj
			if err := c.getInto(ctx, "/v1/admin/scenes", &scenes); err != nil {
				return nil, nil, err
			}
			out := make([]obj, 0, len(scenes))
			for _, sc := range scenes {
				hotspots, _ := sc["hotspots"].([]any)
				out = append(out, obj{
					"id": sc["id"], "title": sc["title"], "difficulty": sc["difficulty"],
					"status": sc["status"], "category": sc["category"], "order": sc["order"],
					"has_image": str(sc, "backgroundImageURL") != "",
					"hotspots":  len(hotspots),
				})
			}
			return jsonResult(out)
		})

	mcp.AddTool(s, &mcp.Tool{Name: "get_scene", Annotations: ro,
		Description: "Get one scene. view=summary (default): metadata + one line per dialogue, small. " +
			"view=edit: the exact payload shape for update_scene (no ids/timings/progress) — modify it and send it back. view=full: raw server response."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in getSceneArgs) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			raw, err := c.get(ctx, "/v1/admin/scenes/"+id)
			if err != nil {
				return nil, nil, err
			}
			switch in.View {
			case "full":
				return textResult(raw), nil, nil
			case "edit", "", "summary":
			default:
				return nil, nil, fmt.Errorf("unknown view %q (summary | edit | full)", in.View)
			}
			var sc obj
			if err := json.Unmarshal(raw, &sc); err != nil {
				return nil, nil, err
			}
			if in.View == "edit" {
				return jsonResult(sceneEditPayload(sc))
			}
			return jsonResult(sceneSummary(sc))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "generate_scene",
		Description: "Ask the server's AI to draft scene content (title, hotspots, dialogues, words, image_prompt). Saves nothing — pass the result (adjusted) to create_scene_draft."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in generateSceneArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/generate-scene",
				obj{"prompt": in.Prompt, "difficulty": in.Difficulty, "grammar_topic": in.GrammarTopic}))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "create_scene_draft",
		Description: "Create a scene as an unpublished draft (an image is optional for drafts). The admin publishes it in the panel."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in sceneArgs) (*mcp.CallToolResult, any, error) {
			if strings.TrimSpace(in.FilePath) != "" {
				raw, err := os.ReadFile(in.FilePath)
				if err != nil {
					return nil, nil, fmt.Errorf("read %s: %w", in.FilePath, err)
				}
				if err := json.Unmarshal(raw, &in.Scene); err != nil {
					return nil, nil, fmt.Errorf("parse %s: %w", in.FilePath, err)
				}
			}
			if in.Scene == nil {
				return nil, nil, errors.New("scene or file_path is required")
			}
			payload := merge(in.Scene, obj{"is_published": false})
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/scenes", payload))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "update_scene",
		Description: "Replace a scene's content (full payload — get it with get_scene view=edit, change it, send it here). Its published/draft state is never changed. Note: dialogue ids are regenerated on edit."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in updateSceneArgs) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			if in.Scene == nil {
				return nil, nil, errors.New("scene is required")
			}
			var current obj
			if err := c.getInto(ctx, "/v1/admin/scenes/"+id, &current); err != nil {
				return nil, nil, err
			}
			payload := merge(in.Scene, obj{"is_published": str(current, "status") == "published"})
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/scenes/"+id, payload))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "set_scene_difficulty",
		Description: "Move a scene to another level (starter | beginner | intermediate | advanced | proficient). Only the level changes: " +
			"dialogues, audio, dialogue ids and users' progress are kept, and the publish state is not touched."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in sceneDifficultyArgs) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			return rawResult(c.sendJSON(ctx, http.MethodPatch, "/v1/admin/scenes/"+id+"/difficulty", obj{"difficulty": in.Difficulty}))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "fill_scene_audio",
		Description: "Generate TTS audio for every dialogue of a scene that has no audio_url, then save the scene once. " +
			"Existing audio is kept; publish state is kept. Map each speaker to a voice (list_tts_voices); unmapped speakers get default_voice. " +
			"Note: saving regenerates dialogue ids (same as editing in the panel)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in fillAudioArgs) (*mcp.CallToolResult, any, error) {
			return fillSceneAudio(ctx, c, in)
		})

	mcp.AddTool(s, &mcp.Tool{Name: "edit_scene_lines",
		Description: "Change the text/translation (and optionally word/phrase chips) of specific dialogue lines, then regenerate audio only for those lines. " +
			"Each edit names hotspot + line (1-based) and the current old_text as a safety check. Other lines and their audio are kept. " +
			"Refuses published scenes unless allow_published=true."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in editLinesArgs) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			if len(in.Edits) == 0 {
				return nil, nil, errors.New("edits is required")
			}
			var current obj
			if err := c.getInto(ctx, "/v1/admin/scenes/"+id, &current); err != nil {
				return nil, nil, err
			}
			published := str(current, "status") == "published"
			if published && !in.AllowPublished {
				return nil, nil, errors.New("scene is published: editing regenerates dialogue ids and wipes users' per-dialogue progress; pass allow_published=true if intended")
			}
			payload := sceneEditPayload(current)
			hotspots := payload["hotspots"].([]obj)
			for _, e := range in.Edits {
				if e.Hotspot < 1 || e.Hotspot > len(hotspots) {
					return nil, nil, fmt.Errorf("hotspot %d out of range", e.Hotspot)
				}
				ds, _ := hotspots[e.Hotspot-1]["dialogues"].([]obj)
				if e.Line < 1 || e.Line > len(ds) {
					return nil, nil, fmt.Errorf("hotspot %d line %d out of range", e.Hotspot, e.Line)
				}
				d := ds[e.Line-1]
				if strings.TrimSpace(str(d, "original_text")) != strings.TrimSpace(e.OldText) {
					return nil, nil, fmt.Errorf("hotspot %d line %d is %q, not %q", e.Hotspot, e.Line, str(d, "original_text"), e.OldText)
				}
				if strings.TrimSpace(e.Text) == "" || strings.TrimSpace(e.Translation) == "" {
					return nil, nil, fmt.Errorf("hotspot %d line %d: text and translation are required", e.Hotspot, e.Line)
				}
				d["original_text"], d["translation"], d["audio_url"] = e.Text, e.Translation, ""
				if e.Words != nil {
					d["words"] = e.Words
				}
				if e.Phrases != nil {
					d["phrases"] = e.Phrases
				}
			}
			payload["is_published"] = published
			if _, err := c.sendJSON(ctx, http.MethodPut, "/v1/admin/scenes/"+id, payload); err != nil {
				return nil, nil, fmt.Errorf("saving the edited lines failed: %w", err)
			}
			return fillSceneAudio(ctx, c, fillAudioArgs{ID: in.ID, Voices: in.Voices, DefaultVoice: in.DefaultVoice, Speed: in.Speed})
		})

	mcp.AddTool(s, &mcp.Tool{Name: "set_scene_layout",
		Description: "Set a scene's background image and/or hotspot positions (percent of the image) and names, keeping all dialogues and audio. " +
			"Refuses published scenes unless allow_published=true."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in sceneLayoutArgs) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			var current obj
			if err := c.getInto(ctx, "/v1/admin/scenes/"+id, &current); err != nil {
				return nil, nil, err
			}
			published := str(current, "status") == "published"
			if published && !in.AllowPublished {
				return nil, nil, errors.New("scene is published: saving regenerates dialogue ids and wipes users' per-dialogue progress; pass allow_published=true if intended")
			}
			payload := sceneEditPayload(current)
			if in.BackgroundImageURL != "" {
				payload["background_image_url"] = in.BackgroundImageURL
			}
			hotspots := payload["hotspots"].([]obj)
			for _, l := range in.Hotspots {
				if l.Order < 1 || l.Order > len(hotspots) {
					return nil, nil, fmt.Errorf("hotspot %d out of range", l.Order)
				}
				if l.X < 0 || l.X > 100 || l.Y < 0 || l.Y > 100 {
					return nil, nil, fmt.Errorf("hotspot %d: x/y must be 0-100", l.Order)
				}
				h := hotspots[l.Order-1]
				h["x_position"], h["y_position"] = l.X, l.Y
				if l.Name != "" {
					h["name"] = l.Name
				}
			}
			payload["is_published"] = published
			if _, err := c.sendJSON(ctx, http.MethodPut, "/v1/admin/scenes/"+id, payload); err != nil {
				return nil, nil, err
			}
			var after obj
			if err := c.getInto(ctx, "/v1/admin/scenes/"+id, &after); err != nil {
				return nil, nil, err
			}
			return jsonResult(sceneSummary(after))
		})

	// ---- مسیر آموزشی ----
	mcp.AddTool(s, &mcp.Tool{Name: "get_learning_path", Annotations: ro,
		Description: "Get a learning path (weeks, sessions, items and checkpoint content) by level, as the admin sees it. Pass file_path to write the JSON to a file instead of returning it (these paths are ~80 KB)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in getPathArgs) (*mcp.CallToolResult, any, error) {
			raw, err := c.get(ctx, "/v1/admin/paths/"+url.PathEscape(in.Level))
			if err != nil || strings.TrimSpace(in.FilePath) == "" {
				return rawResult(raw, err)
			}
			if err := os.WriteFile(in.FilePath, raw, 0o600); err != nil {
				return nil, nil, fmt.Errorf("write %s: %w", in.FilePath, err)
			}
			return textResult([]byte(fmt.Sprintf(`{"saved_to":%q,"bytes":%d}`, in.FilePath, len(raw)))), nil, nil
		})

	mcp.AddTool(s, &mcp.Tool{Name: "save_learning_path",
		Description: "Create or update a whole learning path for one level from a local JSON file. Weeks are matched by position so user progress is kept. " +
			"A new path is saved inactive; an existing path keeps its active state (publish it in the panel)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in savePathArgs) (*mcp.CallToolResult, any, error) {
			if strings.TrimSpace(in.Level) == "" || strings.TrimSpace(in.FilePath) == "" {
				return nil, nil, errors.New("level and file_path are required")
			}
			raw, err := os.ReadFile(in.FilePath)
			if err != nil {
				return nil, nil, err
			}
			var payload obj
			if err := json.Unmarshal(raw, &payload); err != nil {
				return nil, nil, fmt.Errorf("file is not valid JSON: %w", err)
			}
			active := false
			var current obj
			if err := c.getInto(ctx, "/v1/admin/paths/"+url.PathEscape(in.Level), &current); err == nil {
				active, _ = current["is_active"].(bool)
			}
			payload["is_active"] = active
			payload["level"] = in.Level
			out, err := c.sendJSON(ctx, http.MethodPut, "/v1/admin/paths/"+url.PathEscape(in.Level), payload)
			if err != nil {
				return nil, nil, err
			}
			var saved obj
			if err := json.Unmarshal(out, &saved); err != nil {
				return rawResult(out, nil)
			}
			weeks := anyList(saved["weeks"])
			summary := obj{"id": saved["id"], "level": saved["level"], "is_active": saved["is_active"], "weeks": len(weeks)}
			var list []obj
			for _, w := range weeks {
				items := 0
				for _, se := range anyList(w["sessions"]) {
					items += len(anyList(se["items"]))
				}
				list = append(list, obj{"position": w["position"], "title_fa": w["title_fa"], "sessions": len(anyList(w["sessions"])), "items": items})
			}
			summary["week_list"] = list
			return jsonResult(summary)
		})

	mcp.AddTool(s, &mcp.Tool{Name: "generate_checkpoint_audio",
		Description: "Generate TTS for every checkpoint listening line (all weeks of a path) that has no audio_url yet. Safe to re-run."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in checkpointAudioArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/paths/"+url.PathEscape(in.Level)+"/checkpoint-audio", obj{"voices": in.Voices}))
		})

	// ---- صدا و آپلود ----
	mcp.AddTool(s, &mcp.Tool{Name: "list_tts_voices", Annotations: ro, Description: "List TTS voices of the active provider."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/tts-voices"))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "generate_audio",
		Description: "Generate speech for one English line with the server's TTS and return its audio url (use it as a dialogue audio_url)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in generateAudioArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/generate-audio",
				obj{"text": in.Text, "voice_id": in.VoiceID, "speed": in.Speed}))
		})

	for _, u := range []struct{ name, desc, path, field string }{
		{"upload_image", "Upload an image (scene background, podcast/topic picture) and return its url.", "/v1/admin/upload", "image"},
		{"upload_audio", "Upload an audio file and return its url.", "/v1/admin/upload-audio", "audio"},
		{"upload_video", "Upload a video for a video clip and return its url (then detect_video_lines).", "/v1/admin/video-clips/upload-video", "video"},
	} {
		u := u
		mcp.AddTool(s, &mcp.Tool{Name: u.name, Description: u.desc},
			func(ctx context.Context, _ *mcp.CallToolRequest, in sourceArg) (*mcp.CallToolResult, any, error) {
				if strings.TrimSpace(in.Source) == "" {
					return nil, nil, errors.New("source is required")
				}
				link, err := c.upload(ctx, u.path, u.field, in.Source)
				if err != nil {
					return nil, nil, err
				}
				return jsonResult(obj{"url": link})
			})
	}

	// ---- کتابخانه و اصطلاحات ----
	mcp.AddTool(s, &mcp.Tool{Name: "list_resources", Annotations: ro, Description: "List content-library resources (JSON reference files) without their content."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/resources"))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "get_resource", Annotations: ro, Description: "Get one library resource including its JSON content."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in idArg) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			return rawResult(c.get(ctx, "/v1/admin/resources/"+id))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "save_resource", Description: "Create (no id) or update (with id) a content-library resource."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in resourceArgs) (*mcp.CallToolResult, any, error) {
			payload := obj{"title": in.Title, "kind": in.Kind, "notes": in.Notes}
			if in.FileName != "" {
				payload["file_name"] = in.FileName
			}
			if in.Content != nil {
				payload["content"] = in.Content
			}
			if in.ID == "" {
				return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/resources", payload))
			}
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/resources/"+id, payload))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "list_idioms", Annotations: ro, Description: "List all idioms."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/idioms"))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "import_idioms", Description: "Bulk-import idioms. Existing phrases are skipped unless overwrite is true."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in importIdiomsArgs) (*mcp.CallToolResult, any, error) {
			if len(in.Items) == 0 {
				return nil, nil, errors.New("items is empty")
			}
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/idioms/import", obj{"items": in.Items, "overwrite": in.Overwrite}))
		})

	// ---- افعال چندمعنایی ----
	mcp.AddTool(s, &mcp.Tool{Name: "list_verbs", Annotations: ro, Description: "List polysemous verbs with meaning and lesson-sentence counts."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/verbs"))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "get_verb", Annotations: ro, Description: "Get one verb with its meanings (incl. CEFR level) and the lesson sentences found for it (suggested/approved/rejected)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in idArg) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			return rawResult(c.get(ctx, "/v1/admin/verbs/"+id))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "save_verb", Description: "Create a verb (unpublished) or update its lemma/forms/order. The publish state is never changed; the admin publishes in the panel."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in verbArgs) (*mcp.CallToolResult, any, error) {
			payload := obj{"lemma": in.Lemma, "forms": in.Forms, "sort_order": in.SortOrder, "is_published": false}
			if in.ID == "" {
				return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/verbs", payload))
			}
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			var cur struct {
				Verb obj `json:"verb"`
			}
			if err := c.getInto(ctx, "/v1/admin/verbs/"+id, &cur); err != nil {
				return nil, nil, err
			}
			payload["is_published"] = cur.Verb["is_published"]
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/verbs/"+id, payload))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "save_verb_meaning", Description: "Create or update one meaning of a verb (Persian meaning, explanation, fallback example, practice prompt, CEFR level). On update only the fields you pass change."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in verbMeaningArgs) (*mcp.CallToolResult, any, error) {
			payload := obj{
				"meaning_fa": in.MeaningFa, "explanation_fa": in.ExplanationFa, "fallback_example": in.FallbackExample,
				"practice_prompt_fa": in.PracticePromptFa, "level": in.Level, "sort_order": in.SortOrder,
			}
			if in.MeaningID != "" {
				mid, err := pathID(in.MeaningID)
				if err != nil {
					return nil, nil, err
				}
				// به‌روزرسانی جزئی: فیلدهایی که فرستاده نشده‌اند از مقدار فعلی معنا پر می‌شوند،
				// چون API همه‌ی فیلدها را با هم بازنویسی می‌کند.
				vid, err := pathID(in.VerbID)
				if err != nil {
					return nil, nil, err
				}
				var cur struct {
					Meanings []obj `json:"meanings"`
				}
				if err := c.getInto(ctx, "/v1/admin/verbs/"+vid, &cur); err != nil {
					return nil, nil, err
				}
				var old obj
				for _, m := range cur.Meanings {
					if m["id"] == in.MeaningID {
						old = m
					}
				}
				if old == nil {
					return nil, nil, errors.New("meaning not found in this verb")
				}
				for k, v := range payload {
					if v == "" || (k == "sort_order" && in.SortOrder == 0) {
						payload[k] = old[k]
					}
				}
				return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/verbs/meanings/"+mid, payload))
			}
			vid, err := pathID(in.VerbID)
			if err != nil {
				return nil, nil, err
			}
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/verbs/"+vid+"/meanings", payload))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "suggest_verb_meanings", Annotations: ro, Description: "AI-suggested meanings for a verb (with CEFR level). Nothing is saved; use save_verb_meaning."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in idArg) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/verbs/"+id+"/suggest-meanings", obj{}))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "scan_verb", Description: "Search all lesson dialogues for the verb's forms and let AI guess the meaning of each sentence (results are 'suggested'; review with review_verb_occurrence)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in idArg) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/verbs/"+id+"/scan", obj{}))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "review_verb_occurrence", Description: "Approve (with a meaning), reject or reset one lesson sentence found for a verb."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in reviewOccurrenceArgs) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/verbs/occurrences/"+id, obj{"status": in.Status, "meaning_id": in.MeaningID}))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "review_verb_occurrences", Description: "Review many lesson sentences in one call (same fields as review_verb_occurrence). Returns how many succeeded and the errors."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in reviewOccurrencesArgs) (*mcp.CallToolResult, any, error) {
			if len(in.Items) > 200 {
				return nil, nil, fmt.Errorf("at most 200 items per call, got %d", len(in.Items))
			}
			ok := 0
			var failed []obj
			for _, it := range in.Items {
				id, err := pathID(it.ID)
				if err == nil {
					_, err = c.sendJSON(ctx, http.MethodPut, "/v1/admin/verbs/occurrences/"+id, obj{"status": it.Status, "meaning_id": it.MeaningID})
				}
				if err != nil {
					failed = append(failed, obj{"id": it.ID, "error": err.Error()})
					continue
				}
				ok++
			}
			return jsonResult(obj{"ok": ok, "failed": failed})
		})

	mcp.AddTool(s, &mcp.Tool{Name: "fix_scene_text", Description: "Safely fix a scene IN PLACE, also when it is published: Persian translations and word/phrase chip meanings of given dialogue lines and/or the grammar note topic/explanation/examples. " +
		"English text, audio, dialogue ids and user progress are NOT touched (unlike update_scene / edit_scene_lines, which rebuild the scene and wipe progress)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in fixSceneTextArgs) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.SceneID)
			if err != nil {
				return nil, nil, err
			}
			body := obj{"translations": in.Translations}
			if t := strings.TrimSpace(in.GrammarTopic); t != "" {
				body["grammar_topic"] = t
			}
			if e := strings.TrimSpace(in.GrammarExplanation); e != "" {
				body["grammar_explanation"] = e
			}
			if len(in.GrammarExamples) > 0 {
				body["grammar_examples"] = in.GrammarExamples
			}
			return rawResult(c.sendJSON(ctx, http.MethodPatch, "/v1/admin/scenes/"+id+"/text-fixes", body))
		})

	// ---- بسته‌های مسیر هدف‌محور ----
	mcp.AddTool(s, &mcp.Tool{Name: "get_goal_pack", Annotations: ro, Description: "Get the situations of a goal pack (travel | migration | study | work) with their scene ids."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in goalPackArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/goal-packs/"+url.PathEscape(in.Goal)))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "save_goal_pack", Description: "Replace a goal pack (travel | migration | study | work) with the given ordered situations. Scenes are the existing published scenes; an empty scene_ids means the situation still needs content."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in goalPackArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/goal-packs/"+url.PathEscape(in.Goal), obj{"items": in.Items}))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "get_goal_extras", Annotations: ro, Description: "Get the non-scene practice of a goal pack (podcasts, speaking topics, writing prompts) shown in the user's goal plan."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in goalExtrasArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/goal-packs/"+url.PathEscape(in.Goal)+"/extras"))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "save_goal_extras", Description: "Replace the non-scene practice of a goal pack: the WHOLE ordered list of {kind: podcast | topic | writing, ref_id}. The app shows only active items up to the learner's level."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in goalExtrasArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/goal-packs/"+url.PathEscape(in.Goal)+"/extras", obj{"items": in.Items}))
		})

	// ---- تست تعیین سطح ----
	mcp.AddTool(s, &mcp.Tool{Name: "list_assessment_items", Annotations: ro, Description: "List all placement-test items (v1: shadow/free_speech, v2: vocab_yesno/listen_choice/imitation)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/assessment-items"))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "save_assessment_items", Description: "Create or update placement-test items in one call. Returns how many succeeded and the errors."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in assessmentItemsArgs) (*mcp.CallToolResult, any, error) {
			if len(in.Items) > 150 {
				return nil, nil, fmt.Errorf("at most 150 items per call, got %d", len(in.Items))
			}
			ok := 0
			var failed []obj
			for _, it := range in.Items {
				active := true
				if it.IsActive != nil {
					active = *it.IsActive
				}
				body := obj{
					"kind": it.Kind, "category": it.Category, "prompt_text": it.PromptText,
					"target_text": it.TargetText, "audio_url": it.AudioURL, "cefr": it.CEFR,
					"band": it.Band, "is_pseudo": it.IsPseudo, "options": it.Options,
					"correct_index": it.CorrectIndex, "is_active": active,
				}
				var err error
				if it.ID == "" {
					_, err = c.sendJSON(ctx, http.MethodPost, "/v1/admin/assessment-items", body)
				} else {
					var id string
					if id, err = pathID(it.ID); err == nil {
						_, err = c.sendJSON(ctx, http.MethodPut, "/v1/admin/assessment-items/"+id, body)
					}
				}
				if err != nil {
					failed = append(failed, obj{"prompt_text": it.PromptText, "error": err.Error()})
					continue
				}
				ok++
			}
			return jsonResult(obj{"ok": ok, "failed": failed})
		})

	// ---- پادکست ----
	mcp.AddTool(s, &mcp.Tool{Name: "list_podcasts", Annotations: ro, Description: "List podcasts (compact, without lines)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			var list []obj
			if err := c.getInto(ctx, "/v1/admin/podcasts", &list); err != nil {
				return nil, nil, err
			}
			for _, p := range list {
				delete(p, "lines")
				delete(p, "vocabulary")
			}
			return jsonResult(list)
		})

	mcp.AddTool(s, &mcp.Tool{Name: "get_podcast", Annotations: ro, Description: "Get one podcast with lines, vocabulary and audio status."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in idArg) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			return rawResult(c.get(ctx, "/v1/admin/podcasts/"+id))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "get_podcast_level_presets", Annotations: ro, Description: "Per-level podcast script limits and speech pace."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/podcasts/level-presets"))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "generate_podcast_script",
		Description: "Ask the server's AI to write a two-speaker podcast script. Zero limits use the level preset. Saves nothing — pass the result to create_podcast_draft."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in podcastScriptArgs) (*mcp.CallToolResult, any, error) {
			kind := in.Kind
			if kind == "" {
				kind = "lesson"
			}
			var presets map[string]obj
			if err := c.getInto(ctx, "/v1/admin/podcasts/level-presets", &presets); err == nil {
				if p, ok := presets[in.Level]; ok {
					fill := func(v *int, key string) {
						if *v == 0 {
							if f, ok := p[key].(float64); ok {
								*v = int(f)
							}
						}
					}
					fill(&in.MaxWordsPerSentence, "max_words_per_sentence")
					fill(&in.MinLines, "min_lines")
					fill(&in.MaxLines, "max_lines")
					fill(&in.NewVocab, "new_vocab")
				}
			}
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/podcasts/generate-script", obj{
				"topic": in.Topic, "scene": in.Scene, "source": in.Source, "level": in.Level, "kind": kind,
				"max_words_per_sentence": in.MaxWordsPerSentence, "min_lines": in.MinLines,
				"max_lines": in.MaxLines, "new_vocab": in.NewVocab,
			}))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "create_podcast_draft", Description: "Create a podcast (or, with kind=story, a reading-story chapter) as inactive (hidden from the app). Then generate_podcast_audio."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in podcastArgs) (*mcp.CallToolResult, any, error) {
			fromFile := strings.TrimSpace(in.FilePath) != ""
			if fromFile {
				raw, err := os.ReadFile(in.FilePath)
				if err != nil {
					return nil, nil, fmt.Errorf("read %s: %w", in.FilePath, err)
				}
				if err := json.Unmarshal(raw, &in.Podcast); err != nil {
					return nil, nil, fmt.Errorf("parse %s: %w", in.FilePath, err)
				}
			}
			if in.Podcast == nil {
				return nil, nil, errors.New("podcast or file_path is required")
			}
			payload := merge(in.Podcast, obj{"is_active": false})
			delete(payload, "id")
			raw, err := c.sendJSON(ctx, http.MethodPost, "/v1/admin/podcasts", payload)
			if err != nil || !fromFile {
				return rawResult(raw, err)
			}
			// از فایل: فقط خلاصه، نه کل متن (فصل‌های بلند داستان context را پر می‌کنند).
			var created struct {
				ID          string `json:"id"`
				Title       string `json:"title"`
				Kind        string `json:"kind"`
				Level       string `json:"level"`
				SeriesTitle string `json:"series_title"`
				ChapterNo   int    `json:"chapter_no"`
				LineCount   int    `json:"line_count"`
			}
			if err := json.Unmarshal(raw, &created); err != nil {
				return rawResult(raw, nil)
			}
			summary, _ := json.Marshal(created)
			return rawResult(summary, nil)
		})

	mcp.AddTool(s, &mcp.Tool{Name: "update_podcast",
		Description: "Change some fields of a podcast (partial). is_active is never changed. Changing lines/voices/speed/gap invalidates the audio; regenerate it."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in updateArgs) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			var current obj
			if err := c.getInto(ctx, "/v1/admin/podcasts/"+id, &current); err != nil {
				return nil, nil, err
			}
			payload := merge(current, in.Fields)
			payload["is_active"] = boolField(current, "is_active")
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/podcasts/"+id, payload))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "generate_podcast_audio", Description: "Start building a podcast's audio in the background; poll get_podcast for audio_status."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in idArg) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/podcasts/"+id+"/generate-audio", obj{}))
		})

	// ---- موضوع‌های صحبت ----
	mcp.AddTool(s, &mcp.Tool{Name: "list_speaking_topics", Annotations: ro, Description: "List speaking topics (including picture stories)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/speaking-topics"))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "suggest_speaking_topic", Description: "AI suggestion for a speaking topic (prompt, guide questions, useful phrases). Saves nothing."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in suggestTopicArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/speaking-topics/suggest", obj{"idea": in.Idea, "level": in.Level}))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "create_speaking_topic_draft", Description: "Create a speaking topic as inactive (hidden from the app)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in topicArgs) (*mcp.CallToolResult, any, error) {
			if in.Topic == nil {
				return nil, nil, errors.New("topic is required")
			}
			payload := merge(in.Topic, obj{"is_active": false})
			delete(payload, "id")
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/speaking-topics", payload))
		})

	// ---- تمرین نوشتن ----
	mcp.AddTool(s, &mcp.Tool{Name: "list_writing_prompts", Annotations: ro, Description: "List writing prompts (the AI-corrected writing practice topics)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/writing-prompts"))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "suggest_writing_prompt", Description: "AI suggestion for a writing prompt (prompt, guide questions, useful phrases). Saves nothing."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in suggestTopicArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/writing-prompts/suggest", obj{"idea": in.Idea, "level": in.Level}))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "create_writing_prompt_draft", Description: "Create a writing prompt as inactive (hidden from the app)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in writingPromptArgs) (*mcp.CallToolResult, any, error) {
			if in.Prompt == nil {
				return nil, nil, errors.New("prompt is required")
			}
			payload := merge(in.Prompt, obj{"is_active": false})
			delete(payload, "id")
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/writing-prompts", payload))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "update_writing_prompt", Description: "Change some fields of a writing prompt (partial). is_active is never changed."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in updateArgs) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			var list []obj
			if err := c.getInto(ctx, "/v1/admin/writing-prompts", &list); err != nil {
				return nil, nil, err
			}
			var current obj
			for _, t := range list {
				if fmt.Sprint(t["id"]) == in.ID {
					current = t
				}
			}
			if current == nil {
				return nil, nil, fmt.Errorf("writing prompt %s not found", in.ID)
			}
			payload := merge(current, in.Fields)
			payload["is_active"] = boolField(current, "is_active")
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/writing-prompts/"+id, payload))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "update_speaking_topic", Description: "Change some fields of a speaking topic (partial). is_active is never changed."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in updateArgs) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			var list []obj
			if err := c.getInto(ctx, "/v1/admin/speaking-topics", &list); err != nil {
				return nil, nil, err
			}
			var current obj
			for _, t := range list {
				if fmt.Sprint(t["id"]) == in.ID {
					current = t
				}
			}
			if current == nil {
				return nil, nil, fmt.Errorf("speaking topic %s not found", in.ID)
			}
			payload := merge(current, in.Fields)
			payload["is_active"] = boolField(current, "is_active")
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/speaking-topics/"+id, payload))
		})

	// ---- کلیپ ویدیو ----
	mcp.AddTool(s, &mcp.Tool{Name: "list_video_clips", Annotations: ro, Description: "List video clips (compact, without lines)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			var list []obj
			if err := c.getInto(ctx, "/v1/admin/video-clips", &list); err != nil {
				return nil, nil, err
			}
			for _, v := range list {
				delete(v, "lines")
			}
			return jsonResult(list)
		})

	mcp.AddTool(s, &mcp.Tool{Name: "get_video_clip", Annotations: ro, Description: "Get one video clip with its lines."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in idArg) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			return rawResult(c.get(ctx, "/v1/admin/video-clips/"+id))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "detect_video_lines", Description: "Transcribe an uploaded video into timed lines (STT). Saves nothing."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in detectLinesArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/video-clips/detect-lines", obj{"video_url": in.VideoURL}))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "complete_video_clip", Description: "AI fills translations/vocabulary for clip lines. Saves nothing."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in completeClipArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/video-clips/complete",
				obj{"title": in.Title, "description_fa": in.DescriptionFa, "level": in.Level, "lines": in.Lines}))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "create_video_clip_draft", Description: "Create a video clip as inactive (hidden from the app)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in clipArgs) (*mcp.CallToolResult, any, error) {
			if in.Clip == nil {
				return nil, nil, errors.New("clip is required")
			}
			payload := merge(in.Clip, obj{"is_active": false})
			delete(payload, "id")
			return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/video-clips", payload))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "update_video_clip", Description: "Change some fields of a video clip (partial). is_active is never changed."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in updateArgs) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			var current obj
			if err := c.getInto(ctx, "/v1/admin/video-clips/"+id, &current); err != nil {
				return nil, nil, err
			}
			payload := merge(current, in.Fields)
			payload["is_active"] = boolField(current, "is_active")
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/video-clips/"+id, payload))
		})

	// ---- گزارش‌ها (فقط خواندنی) ----
	mcp.AddTool(s, &mcp.Tool{Name: "get_analytics", Annotations: ro, Description: "App analytics summary: daily actives, app versions, screen views, events."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in daysArg) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, fmt.Sprintf("/v1/admin/analytics?days=%d", days(in.Days))))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "get_ai_usage_report", Annotations: ro, Description: "Real AI token usage and dollar cost."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in daysArg) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, fmt.Sprintf("/v1/admin/ai-usage-report?days=%d", days(in.Days))))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "content_health", Annotations: ro,
		Description: "Find incomplete content: draft scenes, scenes without image or audio, podcasts without ready audio, inactive topics/clips, and counts per level."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			return contentHealth(ctx, c)
		})
}

func contentHealth(ctx context.Context, c *client) (*mcp.CallToolResult, any, error) {
	report := obj{}

	var scenes []obj
	if err := c.getInto(ctx, "/v1/admin/scenes", &scenes); err != nil {
		return nil, nil, err
	}
	perLevel := map[string]map[string]int{}
	var noImage, missingAudio, drafts []obj
	for _, sc := range scenes {
		ref := obj{"id": sc["id"], "title": sc["title"], "difficulty": sc["difficulty"]}
		level, status := str(sc, "difficulty"), str(sc, "status")
		if perLevel[level] == nil {
			perLevel[level] = map[string]int{}
		}
		perLevel[level][status]++
		if status != "published" {
			drafts = append(drafts, ref)
		}
		if str(sc, "backgroundImageURL") == "" {
			noImage = append(noImage, ref)
		}
	}

	// لیستِ صحنه‌ها دیالوگ‌ها را ندارد؛ برای شمردنِ دیالوگ‌های بی‌صدا جزئیاتِ
	// هر صحنه جدا گرفته می‌شود (چند درخواست هم‌زمان).
	silentCounts := make([]int, len(scenes))
	sem := make(chan struct{}, 6)
	var wg sync.WaitGroup
	for i, sc := range scenes {
		wg.Add(1)
		go func(i int, id string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			var full obj
			if err := c.getInto(ctx, "/v1/admin/scenes/"+url.PathEscape(id), &full); err != nil {
				silentCounts[i] = -1
				return
			}
			silentCounts[i] = silentDialogues(full)
		}(i, fmt.Sprint(sc["id"]))
	}
	wg.Wait()
	for i, sc := range scenes {
		if n := silentCounts[i]; n != 0 {
			ref := obj{"id": sc["id"], "title": sc["title"], "difficulty": sc["difficulty"], "status": sc["status"]}
			if n < 0 {
				missingAudio = append(missingAudio, merge(ref, obj{"error": "could not load scene"}))
			} else {
				missingAudio = append(missingAudio, merge(ref, obj{"dialogues_without_audio": n}))
			}
		}
	}
	report["scenes"] = obj{
		"total": len(scenes), "per_level": perLevel,
		"drafts": drafts, "without_image": noImage, "with_missing_dialogue_audio": missingAudio,
	}

	var podcasts []obj
	if err := c.getInto(ctx, "/v1/admin/podcasts", &podcasts); err == nil {
		var notReady, inactive []obj
		for _, p := range podcasts {
			ref := obj{"id": p["id"], "title": p["title"], "level": p["level"], "kind": p["kind"]}
			if str(p, "audio_status") != "ready" {
				notReady = append(notReady, merge(ref, obj{"audio_status": p["audio_status"], "audio_error": p["audio_error"]}))
			}
			if !boolField(p, "is_active") {
				inactive = append(inactive, ref)
			}
		}
		report["podcasts"] = obj{"total": len(podcasts), "audio_not_ready": notReady, "inactive": inactive}
	}

	for _, sec := range []struct{ key, path string }{
		{"speaking_topics", "/v1/admin/speaking-topics"},
		{"video_clips", "/v1/admin/video-clips"},
	} {
		var list []obj
		if err := c.getInto(ctx, sec.path, &list); err != nil {
			continue
		}
		var inactive []obj
		for _, it := range list {
			if !boolField(it, "is_active") {
				inactive = append(inactive, obj{"id": it["id"], "title": it["title"], "level": it["level"]})
			}
		}
		report[sec.key] = obj{"total": len(list), "inactive": inactive}
	}
	return jsonResult(report)
}

func silentDialogues(scene obj) int {
	silent := 0
	hotspots, _ := scene["hotspots"].([]any)
	for _, h := range hotspots {
		hm, _ := h.(map[string]any)
		ds, _ := hm["dialogues"].([]any)
		for _, d := range ds {
			dm, _ := d.(map[string]any)
			if a, _ := dm["audio_url"].(string); a == "" {
				silent++
			}
		}
	}
	return silent
}

func anyList(v any) []obj {
	items, _ := v.([]any)
	out := make([]obj, 0, len(items))
	for _, it := range items {
		if m, ok := it.(map[string]any); ok {
			out = append(out, m)
		}
	}
	return out
}

// pick فقط کلیدهای داده‌شده را (اگر وجود داشته باشند) کپی می‌کند.
func pick(m obj, keys ...string) obj {
	out := obj{}
	for _, k := range keys {
		if v, ok := m[k]; ok {
			out[k] = v
		}
	}
	return out
}

// sceneSummary نمای کوچکِ صحنه: هر دیالوگ یک خط «گوینده: متن — ترجمه».
func sceneSummary(sc obj) obj {
	out := pick(sc, "id", "title", "description", "difficulty", "status", "category", "order", "is_locked", "grammar_topic")
	out["has_image"] = str(sc, "backgroundImageURL") != ""
	silent := 0
	var hotspots []obj
	for _, h := range anyList(sc["hotspots"]) {
		var lines []string
		for _, d := range anyList(h["dialogues"]) {
			mark := ""
			if str(d, "audio_url") == "" {
				mark = " [no audio]"
				silent++
			}
			lines = append(lines, fmt.Sprintf("%s: %s — %s%s", str(d, "speaker"), str(d, "original_text"), str(d, "translation"), mark))
		}
		hotspots = append(hotspots, obj{"name": h["name"], "dialogues": lines})
	}
	out["hotspots"] = hotspots
	out["dialogues_without_audio"] = silent
	return out
}

// sceneEditPayload همان شکلِ payload ساخت/ویرایش صحنه (بدون شناسه، زمان‌بندیِ
// کلمات و پیشرفتِ کاربر؛ زمان‌بندی‌ها بعد از ذخیره از روی صدا دوباره ساخته می‌شوند).
func sceneEditPayload(sc obj) obj {
	out := pick(sc, "title", "description", "difficulty", "category", "is_locked",
		"grammar_topic", "grammar_explanation", "grammar_examples", "grammar_audio_url")
	out["background_image_url"] = str(sc, "backgroundImageURL")
	var hotspots []obj
	for _, h := range anyList(sc["hotspots"]) {
		hp := pick(h, "name", "x_position", "y_position", "order")
		var dialogues []obj
		for _, d := range anyList(h["dialogues"]) {
			dialogues = append(dialogues, pick(d, "order", "speaker", "original_text", "translation", "audio_url",
				"display_type", "partial_hint", "wait_duration", "words", "phrases"))
		}
		hp["dialogues"] = dialogues
		hotspots = append(hotspots, hp)
	}
	out["hotspots"] = hotspots
	return out
}

func fillSceneAudio(ctx context.Context, c *client, in fillAudioArgs) (*mcp.CallToolResult, any, error) {
	id, err := pathID(in.ID)
	if err != nil {
		return nil, nil, err
	}
	var current obj
	if err := c.getInto(ctx, "/v1/admin/scenes/"+id, &current); err != nil {
		return nil, nil, err
	}
	payload := sceneEditPayload(current)

	type job struct {
		d     obj
		voice string
	}
	var jobs []job
	speakers := map[string]string{}
	for _, h := range payload["hotspots"].([]obj) {
		ds, _ := h["dialogues"].([]obj)
		for _, d := range ds {
			if str(d, "audio_url") != "" || strings.TrimSpace(str(d, "original_text")) == "" {
				continue
			}
			voice, ok := in.Voices[str(d, "speaker")]
			if !ok {
				voice = in.DefaultVoice
			}
			speakers[str(d, "speaker")] = voice
			jobs = append(jobs, job{d, voice})
		}
	}
	report := obj{"scene": current["title"], "missing": len(jobs), "speaker_voices": speakers}
	if len(jobs) == 0 || in.DryRun {
		return jsonResult(report)
	}

	// چند درخواست TTS هم‌زمان؛ پلن فعلی ElevenLabs حداکثر ۳ درخواست موازی می‌پذیرد
	// (بیشترش 429 می‌گیرد)، پس ۲ تا تا برای بقیه‌ی سرور هم جا بماند.
	errs := make([]error, len(jobs))
	sem := make(chan struct{}, 2)
	var wg sync.WaitGroup
	for i, j := range jobs {
		wg.Add(1)
		go func(i int, j job) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			raw, err := c.sendJSON(ctx, http.MethodPost, "/v1/admin/generate-audio",
				obj{"text": str(j.d, "original_text"), "voice_id": j.voice, "speed": in.Speed})
			if err != nil {
				errs[i] = err
				return
			}
			var out struct {
				URL string `json:"url"`
			}
			if err := json.Unmarshal(raw, &out); err != nil || out.URL == "" {
				errs[i] = fmt.Errorf("unexpected response: %s", string(raw))
				return
			}
			j.d["audio_url"] = out.URL
		}(i, j)
	}
	wg.Wait()

	var failed []string
	for i, e := range errs {
		if e != nil {
			failed = append(failed, fmt.Sprintf("%s: %v", str(jobs[i].d, "original_text"), e))
		}
	}
	generated := len(jobs) - len(failed)
	report["generated"] = generated
	if len(failed) > 0 {
		report["failed"] = failed
	}
	if generated == 0 {
		return jsonResult(report)
	}
	// صداهای ساخته‌شده حتی اگر بعضی خطا داشتند ذخیره می‌شوند؛ دوباره اجرا کردن فقط باقی‌مانده‌ها را می‌سازد.
	payload["is_published"] = str(current, "status") == "published"
	if _, err := c.sendJSON(ctx, http.MethodPut, "/v1/admin/scenes/"+id, payload); err != nil {
		return nil, nil, fmt.Errorf("audio generated but saving the scene failed: %w", err)
	}
	report["saved"] = true
	return jsonResult(report)
}
