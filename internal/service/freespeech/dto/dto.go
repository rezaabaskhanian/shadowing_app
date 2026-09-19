package dto

// AnalyzeResponse نتیجه‌ی یک تلاشِ Free Speech را برمی‌گرداند — بدون امتیازِ
// عددیِ ساختگی (بخش ۷ سند محصول: «no fake precision»)، فقط رونویسی + بازخوردِ
// ربط + تصحیحِ گرامری (هرکدام که پیدا شده باشد).
type AnalyzeResponse struct {
	Transcript         string `json:"transcript"`
	RelevanceAnswered  string `json:"relevance_answered"`
	RelevanceFeedback  string `json:"relevance_feedback"`
	GrammarCorrection  string `json:"grammar_correction,omitempty"`
	GrammarExplanation string `json:"grammar_explanation,omitempty"`
}

// TranscribeResponse فقط متنِ رونویسی‌شده را برمی‌گرداند (مرحله‌ی اولِ دومرحله‌ای).
type TranscribeResponse struct {
	Transcript string `json:"transcript"`
}

// FeedbackRequest متنِ رونویسی‌شده را برای بازخورد می‌فرستد (مرحله‌ی دوم).
type FeedbackRequest struct {
	SceneID    string `json:"scene_id"`
	Transcript string `json:"transcript"`
}

// FeedbackResponse بازخوردِ ربط + تصحیحِ گرامری برای یک متنِ رونویسی‌شده است.
type FeedbackResponse struct {
	RelevanceAnswered  string `json:"relevance_answered"`
	RelevanceFeedback  string `json:"relevance_feedback"`
	GrammarCorrection  string `json:"grammar_correction,omitempty"`
	GrammarExplanation string `json:"grammar_explanation,omitempty"`
}
