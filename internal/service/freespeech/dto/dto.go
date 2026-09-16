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
