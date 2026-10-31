package aiconversation

// KeyPhrase یک جمله‌ی کلیدیِ موقعیت که کاربر باید در نقش‌آفرینی به کار ببرد.
type KeyPhrase struct {
	EN string `json:"en"`
	FA string `json:"fa"`
}

// Roleplay - سناریوی «نقش‌آفرینی»: یک موقعیت زندگی واقعی (دکتر، بانک، تعمیرکار…)
// که به‌جای صحنه موضوعِ گفتگو با AI می‌شود.
type Roleplay struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	TitleFA     string `json:"title_fa"`
	SituationFA string `json:"situation_fa"`
	// AIRole نقشِ AI به انگلیسی، فقط برای پرامپت (در API اپ برنمی‌گردد).
	AIRole     string      `json:"ai_role,omitempty"`
	UserRoleFA string      `json:"user_role_fa"`
	GoalsFA    []string    `json:"goals_fa"`
	KeyPhrases []KeyPhrase `json:"key_phrases"`
	Category   string      `json:"category"`
	Level      string      `json:"level"`
	PodcastID  string      `json:"podcast_id,omitempty"`
	Position   int         `json:"position"`
	IsActive   bool        `json:"is_active"`
	CreatedAt  string      `json:"created_at,omitempty"`
}
