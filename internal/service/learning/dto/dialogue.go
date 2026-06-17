package dto

type Dialogue struct {
	ID           string `json:"id"`
	Order        int    `json:"order"`
	Speaker      string `json:"speaker"`
	OriginalText string `json:"original_text"`
	Translation  string `json:"translation"`
	AudioURL     string `json:"audio_url"`
	DisplayType  string `json:"display_type"`
	PartialHint  string `json:"partial_hint"`
	WaitDuration int    `json:"wait_duration"`
}
