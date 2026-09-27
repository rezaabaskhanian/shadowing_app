package ttsservice

import (
	"context"
	"testing"

	settingsservice "shadowing-backend/internal/service/settings"
)

type emptySettingsRepo struct{}

func (emptySettingsRepo) GetAll(context.Context) (map[string]string, error) {
	return map[string]string{}, nil
}
func (emptySettingsRepo) Set(context.Context, string, string) error { return nil }

func TestOpenRouterBuildBody(t *testing.T) {
	const line = "No problem, that's what we're here for."
	p := newOpenRouterProvider(settingsservice.New(emptySettingsRepo{}))

	body := p.buildBody(line, "Kore", 0, true)
	if body["model"] != defaultOpenRouterTTSModel || body["input"] != line || body["voice"] != "Kore" {
		t.Fatalf("unexpected body: %v", body)
	}
	if _, ok := body["provider"]; ok {
		t.Error("default speed: no provider options expected")
	}

	body = p.buildBody(line, "Kore", 0.7, true)
	opts := body["provider"].(map[string]any)["options"].(map[string]any)["google-ai-studio"].(map[string]any)
	if opts["speech_metadata"].(map[string]string)["style"] == "" {
		t.Error("slow speed: expected speech_metadata.style")
	}
	if body["input"] != line {
		t.Error("input must stay verbatim")
	}

	if _, ok := p.buildBody(line, "Kore", 0.7, false)["provider"]; ok {
		t.Error("withStyle=false must drop provider options")
	}

	t.Setenv(settingsservice.KeyOpenRouterTTSModel, "openai/gpt-4o-mini-tts-2025-12-15")
	body = p.buildBody(line, "alloy", 1.2, true)
	if body["speed"] != 1.2 {
		t.Errorf("non-google model: expected numeric speed, got %v", body["speed"])
	}
	if _, ok := body["provider"]; ok {
		t.Error("non-google model: no google options expected")
	}
}
