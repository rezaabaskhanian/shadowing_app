package telegramchannel

import (
	"strings"
	"testing"
	"time"
)

func TestGetLessonForToday(t *testing.T) {
	now := time.Now()
	lesson := GetLessonForToday(now)

	if lesson.KeyPhrase == "" {
		t.Fatal("expected non-empty KeyPhrase")
	}
	if lesson.PersianMean == "" {
		t.Fatal("expected non-empty PersianMean")
	}
	if lesson.DialogueA == "" || lesson.DialogueB == "" {
		t.Fatal("expected non-empty dialogue")
	}
}

func TestFormatTelegramMessageHTML(t *testing.T) {
	lesson := DailyLesson{
		Theme:       "اصطلاح کاربردی",
		KeyPhrase:   "Break the ice",
		Phonetic:    "/breɪk ðiː aɪs/",
		PersianMean: "سر صحبت را باز کردن، جو معذب را شکستن",
		DialogueA:   "Everyone seemed nervous at first.",
		DialogueB:   "Yeah, but he cracked a joke to break the ice.",
		Tip:         "در مصاحبه‌های کاری بسیار پرکاربرد است.",
		AppPractice: "این جمله را در سایه‌زنی اپلیکیشن تمرین کنید.",
	}

	msg := FormatTelegramMessageHTML(lesson, "@lingoflow_test_channel", "https://lingoflow.ir")

	if !strings.Contains(msg, "Break the ice") {
		t.Errorf("expected message to contain 'Break the ice'")
	}
	if !strings.Contains(msg, "سر صحبت را باز کردن") {
		t.Errorf("expected message to contain Persian translation")
	}
	if !strings.Contains(msg, "@lingoflow_test_channel") {
		t.Errorf("expected message to contain channel handle with underscores")
	}
	if !strings.Contains(msg, "<b>") {
		t.Errorf("expected message to contain HTML tags")
	}
}
