package errorhandling

import "errors"

var (
	// Session errors
	ErrSessionNotFound         = errors.New("session not found")
	ErrSessionAlreadyStarted   = errors.New("session already started")
	ErrSessionAlreadyCompleted = errors.New("session already completed")
	ErrInvalidUserID           = errors.New("invalid user ID")
	ErrInvalidDialogueID       = errors.New("invalid dialogue ID")
	ErrInvalidStepType         = errors.New("invalid step type")
	ErrStepNotCompleted        = errors.New("step not completed yet")
	ErrNoStepsDefined          = errors.New("no steps defined for this session")
	ErrCurrentStepNotFound     = errors.New("current step not found")

	// Recording errors
	ErrRecordingNotFound = errors.New("recording not found")
	ErrInvalidAudioPath  = errors.New("invalid audio path")
	ErrInvalidDuration   = errors.New("invalid duration")
)
