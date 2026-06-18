package session

type SessionStatus string

const (
	StatusPending   SessionStatus = "pending"
	StatusProgress  SessionStatus = "in_progress"
	StatusCompleted SessionStatus = "completed"
)

type StepType int

const (
	StepListen StepType = 1 // گوش بده
	StepShadow StepType = 2 // تکرار همزمان
	StepRecord StepType = 3 // ضبط مستقل
	StepRepeat StepType = 4 // تکرار تا تسلط
)

func (S StepType) GetStepName() string {
	names := map[StepType]string{

		StepListen: "گوش بده",
		StepShadow: "تکرار همزمان",
		StepRecord: "ضبط مستقل",
		StepRepeat: "تکرار تا تسلط",
	}
	return names[S]
}

// GetStepDescription - دریافت توضیح مرحله
func (s StepType) GetStepDescription() string {
	descriptions := map[StepType]string{
		StepListen: "به صدای اصلی گوش کن و به تلفظ دقت کن",
		StepShadow: "همزمان با صدای اصلی تکرار کن",
		StepRecord: "بدون صدای اصلی، جمله را بگو و ضبط کن",
		StepRepeat: "هر چند بار که نیاز داری تمرین کن تا روان صحبت کنی",
	}
	return descriptions[s]
}

type StepStatus string

const (
	StepStatusPending    StepStatus = "pending"     // در انتظار
	StepStatusInProgress StepStatus = "in_progress" // در حال انجام
	StepStatusCompleted  StepStatus = "completed"   // تکمیل شده
)

type RecordingType string

const (
	RecordingTypeShadow RecordingType = "shadow" // ضبط مرحله شادو
	RecordingTypeRecord RecordingType = "record" // ضبط مرحله مستقل
)
