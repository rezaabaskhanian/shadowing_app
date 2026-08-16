package speecheval

import (
	"context"
	"math"
)

// WordStatus - وضعیت هر کلمه در مقایسه‌ی گفته‌ی کاربر با متن هدف
type WordStatus string

const (
	// WordOK - کلمه درست و واضح ادا شده
	WordOK WordStatus = "ok"
	// WordWeak - کلمه گفته شده ولی مبهم/ناقص بوده (در UI زرد)
	WordWeak WordStatus = "weak"
	// WordMissing - کلمه اصلاً گفته نشده یا کلمه‌ی دیگری جایش آمده (در UI قرمز)
	WordMissing WordStatus = "missing"
)

// WordScore - نمره‌ی یک کلمه‌ی متن هدف
type WordScore struct {
	// Word کلمه‌ی متن هدف (نه چیزی که کاربر گفته)
	Word string `json:"word"`
	// Index جای کلمه در متن هدف، از صفر
	Index int `json:"index"`
	// Score اطمینان ۰ تا ۱۰۰
	Score float64 `json:"score"`
	// Status برای رنگ‌آمیزی در مرحله‌ی Compare
	Status WordStatus `json:"status"`
	// Heard چیزی که واقعاً شنیده شده؛ اگر کلمه اصلاً گفته نشده خالی است
	Heard string `json:"heard,omitempty"`
}

// EvaluationResult - نتیجه ارزیابی تلفظ و روانی گفتار
type EvaluationResult struct {
	PronunciationScore float64 `json:"pronunciation_score"` // 0 - 100
	FluencyScore       float64 `json:"fluency_score"`       // 0 - 100
	OverallScore       float64 `json:"overall_score"`       // 0 - 100

	// Transcript متنی که واقعاً از کاربر شنیده شده. اگر تشخیص گفتار در دسترس
	// نبوده خالی است.
	Transcript string `json:"transcript,omitempty"`

	// Words نمره‌ی تک‌تک کلمه‌های متن هدف. اگر تشخیص گفتار در دسترس نبوده
	// خالی است — یعنی نمره تخمینی است و UI نباید کلمه‌ای را قرمز کند.
	Words []WordScore `json:"words,omitempty"`

	// Estimated یعنی این نمره از روی صدای واقعی نیست و فقط از روی مدت ضبط
	// تخمین زده شده. اپ باید در این حالت نمره را با احتیاط نشان دهد.
	Estimated bool `json:"estimated"`
}

// Input - ورودی ارزیابی
type Input struct {
	// TargetText جمله‌ای که کاربر باید می‌گفته
	TargetText string
	// AudioPath مسیر فایل صوتی ضبط‌شده روی دیسک سرور. اگر خالی باشد ارزیابی
	// ناچار است فقط تخمینی باشد.
	AudioPath string
	// DurationSeconds مدت ضبط کاربر
	DurationSeconds int
	// ExpectedDurationSeconds مدت صدای مرجع
	ExpectedDurationSeconds int
}

// Evaluator - اینترفیس سرویس ارزیابی گفتار
type Evaluator interface {
	Evaluate(ctx context.Context, in Input) EvaluationResult
}

// HybridEvaluator - ارزیابی تخمینی، بدون دست زدن به فایل صدا.
//
// این پیاده‌سازی فقط نقش fallback را دارد: وقتی سرویس تشخیص گفتار یا ffmpeg
// در دسترس نیست، به‌جای اینکه ضبط کاربر با خطا رد شود، یک نمره‌ی تقریبی از
// روی ریتم زمانی برمی‌گردد و با Estimated=true علامت می‌خورد.
type HybridEvaluator struct{}

func NewHybridEvaluator() *HybridEvaluator {
	return &HybridEvaluator{}
}

// Evaluate - محاسبه نمره‌های تلفظ، روانی و نمره‌ی کل
func (e *HybridEvaluator) Evaluate(ctx context.Context, in Input) EvaluationResult {
	expected := in.ExpectedDurationSeconds
	if expected <= 0 {
		expected = 5
	}
	duration := in.DurationSeconds
	if duration <= 0 {
		duration = expected
	}

	// 1️⃣ نمره روانی (Fluency) بر اساس نزدیکی مدت گفتار کاربر به صدای مرجع
	timeRatio := float64(duration) / float64(expected)
	deviation := math.Abs(timeRatio - 1.0)

	fluencyScore := 100.0 - (deviation * 40.0)
	fluencyScore = clamp(fluencyScore, 50.0, 98.0)

	// 2️⃣ نمره تلفظ — بدون صدا واقعاً قابل محاسبه نیست، پس یک مقدار محافظه‌کارانه
	// حول همان ریتم برمی‌گردانیم و با Estimated علامتش می‌زنیم.
	pronunciationScore := clamp(fluencyScore-5.0, 50.0, 90.0)

	overallScore := pronunciationScore*0.5 + fluencyScore*0.5

	return EvaluationResult{
		PronunciationScore: round1(pronunciationScore),
		FluencyScore:       round1(fluencyScore),
		OverallScore:       round1(overallScore),
		Estimated:          true,
	}
}

func clamp(v, lo, hi float64) float64 {
	return math.Min(math.Max(v, lo), hi)
}

func round1(v float64) float64 {
	return math.Round(v*10) / 10
}
