package adminbotservice

import (
	"strings"
	"testing"

	"shadowing-backend/internal/pkg/adminnotice"
)

func TestFormatHasParsableRef(t *testing.T) {
	s := &Service{}
	text := s.format(adminnotice.Notice{
		Kind: adminnotice.KindFeedback, Section: "💬 پیشنهاد و انتقاد", Body: "the app is great",
		UserID: "11111111-2222-3333-4444-555555555555", RefID: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
	})
	if !strings.HasPrefix(text, "💬 پیشنهاد و انتقاد") || !strings.Contains(text, "the app is great") {
		t.Fatalf("unexpected text: %q", text)
	}
	m := refPattern.FindStringSubmatch(text)
	if m == nil || m[1] != "feedback" || m[2] != "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" || m[3] != "11111111-2222-3333-4444-555555555555" {
		t.Fatalf("ref not parsed: %v", m)
	}
}

func TestMaskPhone(t *testing.T) {
	if got := maskPhone("09121234567"); got != "0912***4567" {
		t.Fatalf("got %q", got)
	}
}
