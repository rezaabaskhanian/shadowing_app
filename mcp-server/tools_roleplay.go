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

type saveRoleplaysArgs struct {
	FilePath string `json:"file_path" jsonschema:"absolute path of a local JSON array of roleplays: {id? (replace existing), title, title_fa, situation_fa, ai_role (English: who the AI plays and the situation), user_role_fa, goals_fa: [string], key_phrases: [{en, fa}], category, level (starter|beginner|intermediate|advanced|proficient), podcast_id?, position}"`
}

// registerRoleplayTools ابزارهای «نقش‌آفرینی» (سناریوهای گفتگو با AI در موقعیت‌های
// زندگی واقعی) را اضافه می‌کند. ذخیره هیچ‌وقت منتشر نمی‌کند.
func registerRoleplayTools(s *mcp.Server, c *client) {
	ro := &mcp.ToolAnnotations{ReadOnlyHint: true}

	mcp.AddTool(s, &mcp.Tool{Name: "list_roleplays", Annotations: ro, Description: "List all real-life roleplay scenarios (drafts and published) with AI role, goals and key phrases."},
		func(ctx context.Context, _ *mcp.CallToolRequest, _ noArgs) (*mcp.CallToolResult, any, error) {
			return rawResult(c.get(ctx, "/v1/admin/roleplays"))
		})

	mcp.AddTool(s, &mcp.Tool{Name: "save_roleplays", Description: "Create (no id) or replace (id) roleplay scenarios from a local JSON file. " +
		"Never publishes: new ones are drafts, existing ones keep their published state; the admin publishes in the panel. Returns ids and errors per item."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in saveRoleplaysArgs) (*mcp.CallToolResult, any, error) {
			if strings.TrimSpace(in.FilePath) == "" {
				return nil, nil, errors.New("file_path is required")
			}
			data, err := os.ReadFile(in.FilePath)
			if err != nil {
				return nil, nil, fmt.Errorf("read %s: %w", in.FilePath, err)
			}
			var items []obj
			if err := json.Unmarshal(data, &items); err != nil {
				return nil, nil, fmt.Errorf("parse %s: %w", in.FilePath, err)
			}

			var saved []obj
			var failed []obj
			for i, it := range items {
				id := str(it, "id")
				delete(it, "id")
				it["is_active"] = false
				var raw []byte
				if id == "" {
					raw, err = c.sendJSON(ctx, http.MethodPost, "/v1/admin/roleplays", it)
				} else {
					var cur struct {
						IsActive bool `json:"is_active"`
					}
					if err = c.getInto(ctx, "/v1/admin/roleplays/"+url.PathEscape(id), &cur); err == nil {
						it["is_active"] = cur.IsActive
						raw, err = c.sendJSON(ctx, http.MethodPut, "/v1/admin/roleplays/"+url.PathEscape(id), it)
					}
				}
				if err != nil {
					failed = append(failed, obj{"index": i, "title": str(it, "title"), "error": err.Error()})
					continue
				}
				var out obj
				_ = json.Unmarshal(raw, &out)
				saved = append(saved, obj{"index": i, "id": str(out, "id"), "title": str(out, "title")})
			}
			return jsonResult(obj{"saved": saved, "failed": failed})
		})
}
