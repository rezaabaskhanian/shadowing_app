package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type setPodcastImagesArgs struct {
	FilePath string `json:"file_path" jsonschema:"absolute path of a local JSON object {podcast_id: image_url}; image_url comes from upload_image"`
}

// registerImageTools ابزار وصل کردن گروهیِ عکس کاور به پادکست‌ها را اضافه می‌کند؛
// برخلاف update_podcast فقط خلاصه برمی‌گرداند، نه کل پادکست.
func registerImageTools(s *mcp.Server, c *client) {
	mcp.AddTool(s, &mcp.Tool{Name: "set_podcast_images", Description: "Set the cover image (image_url) of many podcasts or story chapters at once from a local JSON file {podcast_id: image_url}. " +
		"Keeps audio and published state. Returns only ok/failed per id."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in setPodcastImagesArgs) (*mcp.CallToolResult, any, error) {
			if strings.TrimSpace(in.FilePath) == "" {
				return nil, nil, errors.New("file_path is required")
			}
			data, err := os.ReadFile(in.FilePath)
			if err != nil {
				return nil, nil, fmt.Errorf("read %s: %w", in.FilePath, err)
			}
			var items map[string]string
			if err := json.Unmarshal(data, &items); err != nil {
				return nil, nil, fmt.Errorf("parse %s: %w", in.FilePath, err)
			}
			ok := 0
			var failed []obj
			for id, url := range items {
				pid, err := pathID(id)
				if err == nil {
					var current obj
					if err = c.getInto(ctx, "/v1/admin/podcasts/"+pid, &current); err == nil {
						payload := merge(current, obj{"image_url": url})
						payload["is_active"] = boolField(current, "is_active")
						_, err = c.sendJSON(ctx, http.MethodPut, "/v1/admin/podcasts/"+pid, payload)
					}
				}
				if err != nil {
					failed = append(failed, obj{"id": id, "error": err.Error()})
					continue
				}
				ok++
			}
			return jsonResult(obj{"ok": ok, "failed": failed})
		})
}
