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

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// ابزارهای «مصاحبه‌ی شبیه‌سازی‌شده» و «زبان تخصصی». طبق قانون این سرور، هیچ
// ابزاری چیزی را منتشر نمی‌کند: ساخت‌ها غیرفعال‌اند و ویرایش‌ها is_active فعلی را
// نگه می‌دارند.

type interviewSetArgs struct {
	ID       string `json:"id,omitempty" jsonschema:"existing set id to update (empty = create a new inactive set)"`
	FilePath string `json:"file_path,omitempty" jsonschema:"optional absolute path of a local JSON file with the set (used instead of set)"`
	Set      obj    `json:"set,omitempty" jsonschema:"set: kind (job | admission | visa), field_key, title, title_fa, description_fa, level, image_url, interviewer_voice, questions[{id (keep to preserve user answers), text, translation_fa, audio_url, prep_seconds, answer_seconds, tip_fa, sample_answer, sample_answer_fa, key_phrases[]}]"`
}

type interviewAudioArgs struct {
	ID      string  `json:"id" jsonschema:"interview set id"`
	VoiceID string  `json:"voice_id,omitempty" jsonschema:"voice for the interviewer (empty = the set's interviewer_voice, then the TTS default)"`
	Speed   float64 `json:"speed,omitempty" jsonschema:"0.7–1.2, 0 = default"`
}

type fieldKeyArg struct {
	Key string `json:"key" jsonschema:"field key, e.g. medicine"`
}

type specialtyFieldArgs struct {
	Key   string `json:"key" jsonschema:"field key: lowercase letters, digits and _ (e.g. medicine, it, engineering, business)"`
	Field obj    `json:"field" jsonschema:"title_fa, title_en, icon, min_level (default intermediate), position"`
}

type fieldWordsArgs struct {
	Key      string `json:"key"`
	FilePath string `json:"file_path,omitempty" jsonschema:"optional absolute path of a local JSON file: [{word, meaning_fa, example, example_fa, level, audio_url}]"`
	Words    []obj  `json:"words,omitempty" jsonschema:"the WHOLE word list in order (replaces the field's list): {word, meaning_fa, example, example_fa, level, audio_url}"`
}

type contentFieldArgs struct {
	Kind     string `json:"kind" jsonschema:"scene | podcast | speaking_topic | writing_prompt | interview"`
	ID       string `json:"id" jsonschema:"content id"`
	FieldKey string `json:"field_key" jsonschema:"field key, empty = remove the tag"`
}

func readJSONFile(path string, out any) error {
	raw, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read %s: %w", path, err)
	}
	if err := json.Unmarshal(raw, out); err != nil {
		return fmt.Errorf("parse %s: %w", path, err)
	}
	return nil
}

func registerInterviewTools(s *mcp.Server, c *client) {
	ro := &mcp.ToolAnnotations{ReadOnlyHint: true}

	mcp.AddTool(s, &mcp.Tool{Name: "list_interview_sets", Annotations: ro, Description: "List mock-interview sets (job / admission / visa) without their questions."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/interviews"))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "get_interview_set", Annotations: ro, Description: "Get one mock-interview set with its questions."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in idArg) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			return rawResult(c.get(ctx, "/v1/admin/interviews/"+id))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "save_interview_set",
		Description: "Create (no id, always inactive) or update a mock-interview set with its questions. Updating keeps the set's active state; keep each question's id to keep users' answers."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in interviewSetArgs) (*mcp.CallToolResult, any, error) {
			if strings.TrimSpace(in.FilePath) != "" {
				if err := readJSONFile(in.FilePath, &in.Set); err != nil {
					return nil, nil, err
				}
			}
			if in.Set == nil {
				return nil, nil, errors.New("set or file_path is required")
			}
			if in.ID == "" {
				return rawResult(c.sendJSON(ctx, http.MethodPost, "/v1/admin/interviews", merge(in.Set, obj{"is_active": false})))
			}
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			var cur struct {
				IsActive bool `json:"is_active"`
			}
			if err := c.getInto(ctx, "/v1/admin/interviews/"+id, &cur); err != nil {
				return nil, nil, err
			}
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/interviews/"+id, merge(in.Set, obj{"is_active": cur.IsActive})))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "generate_interview_audio",
		Description: "Generate the interviewer's voice for every question of a set that has no audio_url yet, then save the set (active state kept). Returns how many were made and which failed."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in interviewAudioArgs) (*mcp.CallToolResult, any, error) {
			id, err := pathID(in.ID)
			if err != nil {
				return nil, nil, err
			}
			var set obj
			if err := c.getInto(ctx, "/v1/admin/interviews/"+id, &set); err != nil {
				return nil, nil, err
			}
			voice := in.VoiceID
			if voice == "" {
				voice, _ = set["interviewer_voice"].(string)
			}
			qs, _ := set["questions"].([]any)
			made := 0
			var failed []string
			for _, raw := range qs {
				q, ok := raw.(map[string]any)
				if !ok {
					continue
				}
				if u, _ := q["audio_url"].(string); u != "" {
					continue
				}
				text, _ := q["text"].(string)
				var res struct {
					URL string `json:"url"`
				}
				body, err := c.sendJSON(ctx, http.MethodPost, "/v1/admin/generate-audio", obj{"text": text, "voice_id": voice, "speed": in.Speed})
				if err == nil {
					err = json.Unmarshal(body, &res)
				}
				if err != nil || res.URL == "" {
					failed = append(failed, fmt.Sprintf("%s: %v", text, err))
					continue
				}
				q["audio_url"] = res.URL
				made++
			}
			if made > 0 {
				if _, err := c.sendJSON(ctx, http.MethodPut, "/v1/admin/interviews/"+id, set); err != nil {
					return nil, nil, fmt.Errorf("audio made but saving the set failed: %w", err)
				}
			}
			return jsonResult(obj{"generated": made, "failed": failed})
		})

	mcp.AddTool(s, &mcp.Tool{Name: "list_specialty_fields", Annotations: ro, Description: "List specialty fields (English for specific purposes) with word counts."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/specialty/fields"))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "get_specialty_field", Annotations: ro, Description: "Get one specialty field with its words and tagged content (drafts included)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in fieldKeyArg) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/specialty/fields/"+url.PathEscape(in.Key)))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "save_specialty_field",
		Description: "Create (inactive) or update a specialty field by key. Updating keeps its active state."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in specialtyFieldArgs) (*mcp.CallToolResult, any, error) {
			active := false
			var cur struct {
				IsActive bool `json:"is_active"`
			}
			if err := c.getInto(ctx, "/v1/admin/specialty/fields/"+url.PathEscape(in.Key), &cur); err == nil {
				active = cur.IsActive
			}
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/specialty/fields/"+url.PathEscape(in.Key), merge(in.Field, obj{"is_active": active})))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "save_field_words",
		Description: "Replace the whole word list of a specialty field (duplicates and empty words are dropped)."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in fieldWordsArgs) (*mcp.CallToolResult, any, error) {
			if strings.TrimSpace(in.FilePath) != "" {
				if err := readJSONFile(in.FilePath, &in.Words); err != nil {
					return nil, nil, err
				}
			}
			raw, err := c.sendJSON(ctx, http.MethodPut, "/v1/admin/specialty/fields/"+url.PathEscape(in.Key)+"/words", obj{"words": in.Words})
			if err != nil {
				return nil, nil, err
			}
			var d struct {
				Key   string `json:"key"`
				Words []any  `json:"words"`
			}
			_ = json.Unmarshal(raw, &d)
			return jsonResult(obj{"key": d.Key, "word_count": len(d.Words)})
		})

	mcp.AddTool(s, &mcp.Tool{Name: "set_content_field",
		Description: "Tag existing content (scene, podcast, speaking topic, writing prompt or interview set) with a specialty field, or remove the tag with an empty field_key."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in contentFieldArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.sendJSON(ctx, http.MethodPut, "/v1/admin/specialty/content-field",
				obj{"kind": in.Kind, "id": in.ID, "field_key": in.FieldKey}))
		})
}
