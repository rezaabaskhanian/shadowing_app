package aiservice

import (
	"os"

	"github.com/anthropics/anthropic-sdk-go"
)

// Service تولید محتوای صحنه با کمک مدل Claude را انجام می‌دهد.
type Service struct {
	client anthropic.Client
	model  anthropic.Model
}

// New یک سرویس AI می‌سازد. کلید API از متغیر محیطی ANTHROPIC_API_KEY خوانده می‌شود
// و مدل از CLAUDE_MODEL (پیش‌فرض: Opus 4.8) — برای تست ارزان می‌توان روی
// claude-haiku-4-5 یا claude-sonnet-4-6 گذاشت.
func New() Service {
	model := anthropic.Model(os.Getenv("CLAUDE_MODEL"))
	if model == "" {
		model = anthropic.ModelClaudeOpus4_8
	}
	return Service{
		client: anthropic.NewClient(), // ANTHROPIC_API_KEY را خودکار می‌خواند
		model:  model,
	}
}

// Enabled مشخص می‌کند آیا کلید API تنظیم شده است یا نه.
func (s Service) Enabled() bool {
	return os.Getenv("ANTHROPIC_API_KEY") != ""
}
