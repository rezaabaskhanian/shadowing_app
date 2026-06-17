package scence

import (
	"github.com/google/uuid"
)

// type safety
type SceneID string

func NewSenceID() SceneID {

	return SceneID(uuid.NewString())
}

type HotspotID string

func NewHotspotID() HotspotID {

	return HotspotID(uuid.NewString())
}

type DialogueID string

func NewDialogueID() DialogueID {

	return DialogueID(uuid.NewString())
}

type DifficultyLevel string

const (
	DifficultyBeginner     DifficultyLevel = "beginner"
	DifficultyIntermediate DifficultyLevel = "intermediate"
	DifficultyAdvanced     DifficultyLevel = "advanced"
)

type SceneStatus string

const (
	StatusDraft     SceneStatus = "draft"
	StatusPublished SceneStatus = "published"
	StatusLocked    SceneStatus = "locked"
)

type DisplayType string

const (
	DisplayFull    DisplayType = "full"    // متن کامل
	DisplayPartial DisplayType = "partial" // نیمه‌راهنما
	DisplayNone    DisplayType = "none"    // بدون متن
)

type SpeakerType string

const (
	SpeakerCustomer SpeakerType = "customer"
	SpeakerClerk    SpeakerType = "clerk"
	SpeakerNPC      SpeakerType = "npc"
)
