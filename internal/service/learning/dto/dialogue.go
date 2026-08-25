package dto

type Word struct {
	Word    string `json:"word"`
	Meaning string `json:"meaning"`
}

// WordTiming زمان‌بندی یک کلمه در صدای مرجع است (از whisper-service)، برای
// هایلایت کلمه‌به‌کلمه هم‌زمان با پخش در اپ.
type WordTiming struct {
	Word  string  `json:"word"`
	Start float64 `json:"start"`
	End   float64 `json:"end"`
}

type Dialogue struct {
	ID           string       `json:"id"`
	Order        int          `json:"order"`
	Speaker      string       `json:"speaker"`
	OriginalText string       `json:"original_text"`
	Translation  string       `json:"translation"`
	AudioURL     string       `json:"audio_url"`
	DisplayType  string       `json:"display_type"`
	PartialHint  string       `json:"partial_hint"`
	WaitDuration int          `json:"wait_duration"`
	Words        []Word       `json:"words"`
	WordTimings  []WordTiming `json:"word_timings,omitempty"`
}
