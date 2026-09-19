package dto

// ============================================
// StartConversation
// ============================================
type StartConversationRequest struct {
	SceneID string `json:"scene_id"`
}

type TurnDTO struct {
	Role     string `json:"role"`
	Text     string `json:"text"`
	AudioURL string `json:"audio_url,omitempty"`
}

type StartConversationResponse struct {
	ConversationID string  `json:"conversation_id"`
	SceneTitle     string  `json:"scene_title"`
	OpeningTurn    TurnDTO `json:"opening_turn"`
	MaxUserTurns   int     `json:"max_user_turns"`
	MaxHints       int     `json:"max_hints"`
}

// ============================================
// SendTurn
// ============================================
type SendTurnResponse struct {
	UserTranscript    string `json:"user_transcript"`
	AssistantText     string `json:"assistant_text"`
	AssistantAudioURL string `json:"assistant_audio_url,omitempty"`
	// UserGrammarCorrection/UserGrammarExplanation فقط وقتی خطای گرامریِ
	// قابل‌توجهی در نوبتِ کاربر پیدا شده باشد پر می‌شوند (بخش ۱۸ سند محصول).
	UserGrammarCorrection  string `json:"user_grammar_correction,omitempty"`
	UserGrammarExplanation string `json:"user_grammar_explanation,omitempty"`
	TurnNumber             int    `json:"turn_number"`
	MaxUserTurns           int    `json:"max_user_turns"`
	IsEnded                bool   `json:"is_ended"`
}

// ============================================
// Suggest — پیشنهاد جواب به آخرین پیامِ AI
// ============================================
type SuggestRequest struct {
	ConversationID string `json:"conversation_id"`
}

type SuggestionDTO struct {
	Text          string `json:"text"`
	TranslationFA string `json:"translation_fa"`
}

type SuggestResponse struct {
	HintID      string          `json:"hint_id"`
	Suggestions []SuggestionDTO `json:"suggestions"`
	HintsUsed   int             `json:"hints_used"`
	MaxHints    int             `json:"max_hints"`
}
