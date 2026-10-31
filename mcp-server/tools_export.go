package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"
	"sync"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type exportContentArgs struct {
	FilePath string `json:"file_path" jsonschema:"absolute path of the JSON file to write"`
}

// fetchAll جزئیات هر مورد لیست را با چند درخواست هم‌زمان می‌خواند و ترتیب را نگه می‌دارد.
func fetchAll(ctx context.Context, c *client, base string, list []obj) ([]json.RawMessage, error) {
	const workers = 6
	items := make([]json.RawMessage, len(list))
	errs := make([]error, len(list))
	sem := make(chan struct{}, workers)
	var wg sync.WaitGroup
	for i, it := range list {
		id := str(it, "id")
		if id == "" {
			continue
		}
		wg.Add(1)
		sem <- struct{}{}
		go func(i int, id string) {
			defer wg.Done()
			defer func() { <-sem }()
			items[i], errs[i] = c.get(ctx, base+"/"+url.PathEscape(id))
		}(i, id)
	}
	wg.Wait()
	out := make([]json.RawMessage, 0, len(list))
	for i := range items {
		if errs[i] != nil {
			return nil, errs[i]
		}
		if items[i] != nil {
			out = append(out, items[i])
		}
	}
	return out, nil
}

// registerExportTools ابزارِ خروجی گرفتن از متن همه‌ی محتوا (صحنه، پادکست/داستان،
// آهنگ، کلیپ) را اضافه می‌کند؛ ورودیِ گزارش پوشش واژگان است. فقط می‌خواند.
func registerExportTools(s *mcp.Server, c *client) {
	ro := &mcp.ToolAnnotations{ReadOnlyHint: true}

	mcp.AddTool(s, &mcp.Tool{Name: "export_content_text", Annotations: ro,
		Description: "Write the raw admin JSON of all scenes, podcasts (lesson, featured, story), songs and video clips, with their lines, to one local file. " +
			"Input for vocabulary coverage reports. Returns only counts."},
		func(ctx context.Context, _ *mcp.CallToolRequest, in exportContentArgs) (*mcp.CallToolResult, any, error) {
			if strings.TrimSpace(in.FilePath) == "" {
				return nil, nil, errors.New("file_path is required")
			}

			// لیست‌های ادمین متن (دیالوگ/خط) ندارند؛ هر مورد جدا خوانده می‌شود.
			out := map[string]json.RawMessage{}
			for _, key := range []string{"scenes", "podcasts", "songs", "video_clips"} {
				base := map[string]string{
					"scenes":      "/v1/admin/scenes",
					"podcasts":    "/v1/admin/podcasts",
					"songs":       "/v1/admin/songs",
					"video_clips": "/v1/admin/video-clips",
				}[key]
				var list []obj
				if err := c.getInto(ctx, base, &list); err != nil {
					return nil, nil, fmt.Errorf("%s: %w", key, err)
				}
				items, err := fetchAll(ctx, c, base, list)
				if err != nil {
					return nil, nil, fmt.Errorf("%s: %w", key, err)
				}
				joined, err := json.Marshal(items)
				if err != nil {
					return nil, nil, err
				}
				out[key] = joined
			}

			data, err := json.Marshal(out)
			if err != nil {
				return nil, nil, err
			}
			if err := os.WriteFile(in.FilePath, data, 0o600); err != nil {
				return nil, nil, fmt.Errorf("write %s: %w", in.FilePath, err)
			}

			counts := obj{"saved_to": in.FilePath, "bytes": len(data)}
			for k, v := range out {
				var arr []json.RawMessage
				if json.Unmarshal(v, &arr) == nil {
					counts[k] = len(arr)
				}
			}
			return jsonResult(counts)
		})
}
