package scence

import (
	"errors"
	"time"
)

type Dialogue struct {
	ID           DialogueID
	HotspotID    HotspotID
	Order        int // ترتیب دیالوگ در هات‌اسپات
	Speaker      SpeakerType
	OriginalText string // متن انگلیسی
	Translation  string // ترجمه فارسی
	AudioURL     string // آدرس فایل صوتی
	DisplayType  DisplayType
	PartialHint  string // برای حالت partial
	WaitDuration int    // مدت انتظار برای پاسخ (ثانیه)
	CreatedAt    time.Time
}

func NewDialogue(hotspotID HotspotID, order int, speaker SpeakerType,
	originalText, translation string, displayType DisplayType) (Dialogue, error) {

	if originalText == "" {
		return Dialogue{}, errors.New("original text is required")
	}
	if speaker != SpeakerCustomer && speaker != SpeakerClerk && speaker != SpeakerNPC {
		return Dialogue{}, errors.New("invalid speaker type")
	}

	uidDialogue := NewDialogueID()

	return Dialogue{
		ID:           uidDialogue,
		HotspotID:    hotspotID,
		Order:        order,
		Speaker:      speaker,
		OriginalText: originalText,
		Translation:  translation,
		DisplayType:  displayType,
		WaitDuration: 5, // پیش‌فرض 5 ثانیه
		CreatedAt:    time.Now(),
	}, nil
}
func (d Dialogue) SetAudioURL(url string) {
	d.AudioURL = url
}

func (d Dialogue) SetPartialHint(hint string) {
	if d.DisplayType == DisplayPartial {
		d.PartialHint = hint
	}
}
