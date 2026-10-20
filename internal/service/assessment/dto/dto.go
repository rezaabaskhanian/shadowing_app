package dto

// ============================================
// GetTest
// ============================================

type ItemDTO struct {
	ID         string `json:"id"`
	Kind       string `json:"kind"`
	Category   string `json:"category,omitempty"`
	PromptText string `json:"prompt_text"`
	TargetText string `json:"target_text,omitempty"` // فقط برای kind=shadow
	AudioURL   string `json:"audio_url,omitempty"`   // فقط برای kind=shadow
	Difficulty string `json:"difficulty,omitempty"`
}

type GetTestResponse struct {
	Items []ItemDTO `json:"items"`
}

// ============================================
// SubmitAssessment
// ============================================

// SubmitItem - یک آیتم ارسالی؛ LocalAudioPath مسیر فایل روی دیسک سرور است،
// هندلر پرش می‌کند نه کلاینت (مثل الگوی shadowing).
type SubmitItem struct {
	ItemID         string `json:"item_id"`
	LocalAudioPath string `json:"-"`
	Duration       int    `json:"duration"`
}

type ItemResultDTO struct {
	ItemID string `json:"item_id"`
	Kind   string `json:"kind"`
	// Transcript فقط برای free_speech پر می‌شود.
	Transcript string `json:"transcript,omitempty"`
	// RelevanceAnswered/RelevanceFeedback فقط برای free_speech.
	RelevanceAnswered string `json:"relevance_answered,omitempty"`
	RelevanceFeedback string `json:"relevance_feedback,omitempty"`
	// GrammarCorrection/GrammarExplanation فقط برای free_speech، و فقط وقتی
	// خطای گرامریِ قابل‌توجهی پیدا شده باشد (بخش ۱۸ سند محصول).
	GrammarCorrection  string `json:"grammar_correction,omitempty"`
	GrammarExplanation string `json:"grammar_explanation,omitempty"`
	// امتیازها فقط برای shadow پر می‌شوند؛ برای free_speech عمداً nil می‌مانند
	// تا نمره‌ی ساختگی نمایش داده نشود.
	PronunciationScore *float64 `json:"pronunciation_score,omitempty"`
	FluencyScore       *float64 `json:"fluency_score,omitempty"`
	OverallScore       *float64 `json:"overall_score,omitempty"`
}

type SubmitAssessmentResponse struct {
	Level              string          `json:"level"`
	OverallScore       float64         `json:"overall_score"`
	PronunciationScore float64         `json:"pronunciation_score"`
	FluencyScore       float64         `json:"fluency_score"`
	IsEstimated        bool            `json:"is_estimated"`
	Items              []ItemResultDTO `json:"items"`
}

// ============================================
// GetProfile
// ============================================

type GetProfileResponse struct {
	Level              string  `json:"level"`
	OverallScore       float64 `json:"overall_score"`
	PronunciationScore float64 `json:"pronunciation_score"`
	FluencyScore       float64 `json:"fluency_score"`
	IsEstimated        bool    `json:"is_estimated"`
	AssessedAt         string  `json:"assessed_at"`
	// نسخه‌ی ۲؛ برای پروفایل‌های قدیمی test_version=1 و بقیه خالی.
	TestVersion        int    `json:"test_version"`
	ComprehensionLevel string `json:"comprehension_level,omitempty"`
	SpeakingLevel      string `json:"speaking_level,omitempty"`
	VocabSize          int    `json:"vocab_size,omitempty"`
}

// ============================================
// Admin CRUD
// ============================================

type CreateItemRequest struct {
	Kind       string `json:"kind"`
	Category   string `json:"category"`
	PromptText string `json:"prompt_text"`
	TargetText string `json:"target_text"`
	AudioURL   string `json:"audio_url"`
	Difficulty string `json:"difficulty"`
	// نسخه‌ی ۲
	CEFR         string   `json:"cefr"`
	Band         int      `json:"band"`
	IsPseudo     bool     `json:"is_pseudo"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correct_index"`
}

type UpdateItemRequest struct {
	Kind       string `json:"kind"`
	Category   string `json:"category"`
	PromptText string `json:"prompt_text"`
	TargetText string `json:"target_text"`
	AudioURL   string `json:"audio_url"`
	Difficulty string `json:"difficulty"`
	// نسخه‌ی ۲
	CEFR         string   `json:"cefr"`
	Band         int      `json:"band"`
	IsPseudo     bool     `json:"is_pseudo"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correct_index"`
	IsActive     bool     `json:"is_active"`
}

type ItemAdminDTO struct {
	ID         string `json:"id"`
	Kind       string `json:"kind"`
	Category   string `json:"category"`
	PromptText string `json:"prompt_text"`
	TargetText string `json:"target_text,omitempty"`
	AudioURL   string `json:"audio_url,omitempty"`
	Difficulty string `json:"difficulty,omitempty"`
	// نسخه‌ی ۲
	CEFR         string   `json:"cefr,omitempty"`
	Band         int      `json:"band,omitempty"`
	IsPseudo     bool     `json:"is_pseudo,omitempty"`
	Options      []string `json:"options,omitempty"`
	CorrectIndex int      `json:"correct_index"`
	IsActive     bool     `json:"is_active"`
	CreatedAt    string   `json:"created_at"`
}

type ListItemsResponse struct {
	Items []ItemAdminDTO `json:"items"`
}

// ============================================
// Level (سطح مؤثر کاربر: دستی یا از تست)
// ============================================

type LevelResponse struct {
	// SceneLevel سطح مؤثر: beginner / intermediate / advanced
	SceneLevel string `json:"scene_level"`
	// Source: manual (انتخاب دستی) / test (نتیجه‌ی تست) / default (هیچ‌کدام → مبتدی)
	Source string `json:"source"`
	// TestSceneLevel سطح حاصل از تست؛ خالی اگر تست نداده
	TestSceneLevel string `json:"test_scene_level"`
}

type SetLevelRequest struct {
	// رشته‌ی خالی = پاک‌کردن انتخاب دستی و برگشت به نتیجه‌ی تست
	SceneLevel string `json:"scene_level"`
}

// ============================================
// تست نسخه‌ی ۲ (document_placement/placement_design.md)
// ============================================

// VocabItemDTO یک کلمه‌ی بخش لغت. Stage=1 در دور اول (لایه‌های ۱ تا ۳) نشان
// داده می‌شود؛ Stage=2 فقط اگر کاربر در لایه‌ی ۳ دست‌کم ۷۰٪ را بداند. Band
// کلمه‌های ساختگی صفر است.
type VocabItemDTO struct {
	ID    string `json:"id"`
	Word  string `json:"word"`
	Band  int    `json:"band"`
	Stage int    `json:"stage"`
}

// ListenItemDTO یک جمله‌ی بخش شنیدن. متن جمله ارسال نمی‌شود. گزینه‌ی درست
// ارسال می‌شود چون اپ با آن تصمیم تطبیقی (سطح بعدی) را می‌گیرد؛ نمره‌ی نهایی
// به هر حال روی سرور از روی پایگاه‌داده حساب می‌شود و تقلب فقط به ضرر خود
// کاربر است (مسیر سخت‌تر).
type ListenItemDTO struct {
	ID           string   `json:"id"`
	CEFR         string   `json:"cefr"`
	AudioURL     string   `json:"audio_url"`
	Prompt       string   `json:"prompt"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correct_index"`
}

// ImitationItemDTO یک جمله‌ی بخش تکرار؛ متن جمله ارسال نمی‌شود چون کاربر
// نباید آن را ببیند.
type ImitationItemDTO struct {
	ID       string `json:"id"`
	CEFR     string `json:"cefr"`
	AudioURL string `json:"audio_url"`
}

type GetTestV2Response struct {
	Vocab     []VocabItemDTO     `json:"vocab"`
	Listening []ListenItemDTO    `json:"listening"`
	Imitation []ImitationItemDTO `json:"imitation"`
	// Intro بخش اختیاری معرفی خود؛ nil اگر آیتمی تعریف نشده.
	Intro *ItemDTO `json:"intro,omitempty"`
}

type VocabAnswerDTO struct {
	ItemID string `json:"item_id"`
	Known  bool   `json:"known"`
}

type ListenAnswerDTO struct {
	ItemID string `json:"item_id"`
	Choice int    `json:"choice"`
}

// SubmitV2Answers پاسخ‌های بدون صدا (فیلد answers در فرم multipart).
type SubmitV2Answers struct {
	Vocab     []VocabAnswerDTO  `json:"vocab"`
	Listening []ListenAnswerDTO `json:"listening"`
}

type ImitationResultDTO struct {
	ItemID     string  `json:"item_id"`
	CEFR       string  `json:"cefr"`
	Accuracy   float64 `json:"accuracy"` // ۰ تا ۱
	Passed     bool    `json:"passed"`
	Transcript string  `json:"transcript"`
}

type PreviousResultDTO struct {
	Level              string `json:"level"`
	ComprehensionLevel string `json:"comprehension_level"`
	SpeakingLevel      string `json:"speaking_level"`
	VocabSize          int    `json:"vocab_size"`
	AssessedAt         string `json:"assessed_at"`
}

type SubmitV2Response struct {
	// Level سطح شروع مسیر (CEFR) و SceneLevel همان به زبان صحنه‌ها.
	Level              string               `json:"level"`
	SceneLevel         string               `json:"scene_level"`
	ComprehensionLevel string               `json:"comprehension_level"`
	SpeakingLevel      string               `json:"speaking_level"`
	ListeningLevel     string               `json:"listening_level"`
	VocabLevel         string               `json:"vocab_level"`
	VocabSize          int                  `json:"vocab_size"`
	VocabValid         bool                 `json:"vocab_valid"`
	SpeakingMeasured   bool                 `json:"speaking_measured"`
	Imitation          []ImitationResultDTO `json:"imitation"`
	Intro              *ItemResultDTO       `json:"intro,omitempty"`
	Previous           *PreviousResultDTO   `json:"previous,omitempty"`
}
