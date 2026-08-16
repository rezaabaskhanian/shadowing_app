package speecheval

import (
	"math"
	"strings"
	"unicode"
)

// HeardWord - یک کلمه‌ای که سرویس تشخیص گفتار شنیده است
type HeardWord struct {
	Word string
	// Start و End ثانیه، از ابتدای ضبط
	Start float64
	End   float64
	// Probability اطمینان مدل به این کلمه، ۰ تا ۱. معیار ما برای «چقدر واضح
	// ادا شده».
	Probability float64
}

// similarityThresholdWeak حداقل شباهت حرفی برای اینکه دو کلمه «همان کلمه با
// تلفظ بد» حساب شوند نه دو کلمه‌ی متفاوت. زیر این حد، کلمه missing است.
const similarityThresholdWeak = 0.62

// probabilityThresholdOK اطمینان لازم برای اینکه کلمه‌ی درست‌شنیده‌شده «ok»
// حساب شود. پایین‌تر از این یعنی مدل هم مطمئن نبوده، که معمولاً نشانه‌ی تلفظ
// مبهم است.
const probabilityThresholdOK = 0.55

// normalizeWord کلمه را برای مقایسه ساده می‌کند: حروف کوچک، بدون نقطه‌گذاری.
// بدون این کار "Hello," و "hello" دو کلمه‌ی متفاوت حساب می‌شوند و همه‌ی
// جمله‌های آخر خط قرمز می‌شوند.
func normalizeWord(w string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(w) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '\'' {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func normalizeWords(text string) []string {
	fields := strings.Fields(text)
	out := make([]string, 0, len(fields))
	for _, f := range fields {
		if n := normalizeWord(f); n != "" {
			out = append(out, n)
		}
	}
	return out
}

// similarity شباهت دو کلمه بین ۰ و ۱، بر پایه‌ی فاصله‌ی ویرایشی حرفی.
// "beautiful" و "beutiful" حدود ۰.۹ می‌گیرند (تلفظ بد)، ولی "beautiful" و
// "table" نزدیک صفر (کلمه‌ی اشتباه).
func similarity(a, b string) float64 {
	if a == b {
		return 1.0
	}
	if a == "" || b == "" {
		return 0.0
	}
	dist := levenshtein(a, b)
	maxLen := math.Max(float64(len(a)), float64(len(b)))
	return math.Max(0, 1.0-float64(dist)/maxLen)
}

func levenshtein(a, b string) int {
	ar, br := []rune(a), []rune(b)
	prev := make([]int, len(br)+1)
	curr := make([]int, len(br)+1)

	for j := range prev {
		prev[j] = j
	}

	for i := 1; i <= len(ar); i++ {
		curr[0] = i
		for j := 1; j <= len(br); j++ {
			cost := 1
			if ar[i-1] == br[j-1] {
				cost = 0
			}
			curr[j] = min3(curr[j-1]+1, prev[j]+1, prev[j-1]+cost)
		}
		prev, curr = curr, prev
	}
	return prev[len(br)]
}

func min3(a, b, c int) int {
	m := a
	if b < m {
		m = b
	}
	if c < m {
		m = c
	}
	return m
}

// alignment نتیجه‌ی تطبیق یک کلمه‌ی هدف با کلمه‌های شنیده‌شده
type alignment struct {
	heardIndex int // -1 یعنی این کلمه‌ی هدف اصلاً گفته نشده
	similarity float64
}

// alignWords کلمه‌های متن هدف را به کلمه‌های شنیده‌شده تطبیق می‌دهد.
//
// از یک الگوریتم برنامه‌ریزی پویا شبیه Needleman–Wunsch استفاده می‌کند تا
// ترتیب حفظ شود: اگر کاربر یک کلمه را جا بیندازد، بقیه‌ی جمله نباید یک واحد
// جابه‌جا و همه غلط حساب شود — چیزی که با مقایسه‌ی ساده‌ی اندیس‌به‌اندیس اتفاق
// می‌افتد.
func alignWords(target, heard []string) []alignment {
	const gapPenalty = -0.5

	n, m := len(target), len(heard)
	score := make([][]float64, n+1)
	for i := range score {
		score[i] = make([]float64, m+1)
	}
	for i := 1; i <= n; i++ {
		score[i][0] = score[i-1][0] + gapPenalty
	}
	for j := 1; j <= m; j++ {
		score[0][j] = score[0][j-1] + gapPenalty
	}

	for i := 1; i <= n; i++ {
		for j := 1; j <= m; j++ {
			// شباهت را به بازه‌ی [-۱، ۱] می‌بریم تا تطبیق بد بدتر از gap باشد
			match := score[i-1][j-1] + (similarity(target[i-1], heard[j-1])*2 - 1)
			del := score[i-1][j] + gapPenalty
			ins := score[i][j-1] + gapPenalty
			score[i][j] = math.Max(match, math.Max(del, ins))
		}
	}

	result := make([]alignment, n)
	for i := range result {
		result[i] = alignment{heardIndex: -1}
	}

	// عقب‌گرد از گوشه‌ی پایین-راست برای بازسازی مسیر بهینه
	i, j := n, m
	for i > 0 && j > 0 {
		sim := similarity(target[i-1], heard[j-1])
		if score[i][j] == score[i-1][j-1]+(sim*2-1) {
			result[i-1] = alignment{heardIndex: j - 1, similarity: sim}
			i--
			j--
		} else if score[i][j] == score[i-1][j]+gapPenalty {
			i--
		} else {
			j--
		}
	}

	return result
}

// scoreWords از تطبیق کلمه‌ها، نمره‌ی هر کلمه‌ی متن هدف را می‌سازد.
func scoreWords(targetRaw []string, target, heard []string, heardWords []HeardWord) []WordScore {
	aligns := alignWords(target, heard)
	out := make([]WordScore, len(target))

	for i, a := range aligns {
		raw := target[i]
		if i < len(targetRaw) {
			raw = targetRaw[i]
		}

		ws := WordScore{Word: raw, Index: i}

		if a.heardIndex < 0 || a.similarity < similarityThresholdWeak {
			// کلمه گفته نشده یا کلمه‌ی دیگری جایش آمده
			ws.Status = WordMissing
			ws.Score = 0
			if a.heardIndex >= 0 && a.heardIndex < len(heard) {
				ws.Heard = heard[a.heardIndex]
			}
			out[i] = ws
			continue
		}

		// اطمینان مدل به این کلمه؛ اگر زمان‌بندی کلمه‌ای نداشتیم، ۰.۸ فرض
		// می‌کنیم تا نبودِ اطلاعات، خودش تبدیل به جریمه نشود.
		prob := 0.8
		if a.heardIndex < len(heardWords) {
			prob = heardWords[a.heardIndex].Probability
		}
		ws.Heard = heard[a.heardIndex]

		// نمره ترکیبی از «کلمه‌ی درست بود؟» و «واضح ادا شد؟»
		ws.Score = round1((a.similarity*0.6 + prob*0.4) * 100)

		switch {
		case a.similarity >= 0.99 && prob >= probabilityThresholdOK:
			ws.Status = WordOK
		default:
			ws.Status = WordWeak
		}

		out[i] = ws
	}

	return out
}

// fluencyFromTimings روانی را از زمان‌بندی واقعی کلمه‌ها حساب می‌کند.
//
// دو چیز را جریمه می‌کند: سرعت گفتار خیلی دور از صدای مرجع، و مکث‌های طولانی
// وسط جمله (تپق و «اِ...» گفتن).
func fluencyFromTimings(words []HeardWord, expectedSeconds int) float64 {
	if len(words) == 0 {
		return 0
	}

	speechStart := words[0].Start
	speechEnd := words[len(words)-1].End
	speechDuration := speechEnd - speechStart
	if speechDuration <= 0 {
		return 40
	}

	expected := float64(expectedSeconds)
	if expected <= 0 {
		expected = 5
	}

	// ۱) انحراف سرعت گفتار از مرجع
	ratio := speechDuration / expected
	deviation := math.Abs(ratio - 1.0)
	speedScore := 100.0 - deviation*45.0

	// ۲) جریمه‌ی مکث‌های بلند بین کلمه‌ها
	const pauseThreshold = 0.45 // ثانیه
	pausePenalty := 0.0
	for i := 1; i < len(words); i++ {
		gap := words[i].Start - words[i-1].End
		if gap > pauseThreshold {
			pausePenalty += (gap - pauseThreshold) * 12
		}
	}

	return clamp(speedScore-pausePenalty, 0, 100)
}
