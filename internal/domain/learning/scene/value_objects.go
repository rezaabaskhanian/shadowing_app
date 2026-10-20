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
	// DifficultyStarter «قدم اول»: پایه‌تر از مبتدی.
	DifficultyStarter      DifficultyLevel = "starter"
	DifficultyBeginner     DifficultyLevel = "beginner"
	DifficultyIntermediate DifficultyLevel = "intermediate"
	DifficultyAdvanced     DifficultyLevel = "advanced"
	// DifficultyProficient «حرفه‌ای» (C1): بالاتر از advanced.
	DifficultyProficient DifficultyLevel = "proficient"
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
