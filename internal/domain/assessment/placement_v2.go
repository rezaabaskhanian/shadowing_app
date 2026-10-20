package assessment

import (
	"math"
	"strings"
	"unicode"
)

// نمره‌دهی تست تعیین سطح نسخه‌ی ۲ (document_placement/placement_design.md).
// همه‌ی تابع‌ها خالص‌اند تا آستانه‌ها با داده‌ی واقعی کاربران قابل تنظیم و
// تست‌پذیر باشند.

// VocabAnswer پاسخ کاربر به یک کلمه‌ی بخش لغت.
type VocabAnswer struct {
	Band     int // 1..5 برای کلمه‌ی واقعی؛ برای کلمه‌ی ساختگی نادیده گرفته می‌شود
	IsPseudo bool
	Known    bool
}

// VocabResult برآورد دامنه‌ی لغت.
type VocabResult struct {
	Size  int   // تعداد کلمه‌ی تخمینی (از ۰ تا ۵۰۰۰)
	Level Level // سطح متناظر با Size
	// Valid=false یعنی کاربر به کلمه‌های ساختگی زیاد «بله» گفته و این بخش
	// قابل‌اتکا نیست؛ تصمیم سطح فقط با شنیدن گرفته می‌شود.
	Valid bool
}

const (
	wordsPerBand = 1000
	// اگر بیش از این سهم از کلمه‌های ساختگی «بله» بگیرند، بخش لغت نامعتبر است.
	maxPseudoYesRate = 0.4
)

// vocabLevelCeilings سقف دامنه‌ی لغت هر سطح (Milton & Alexiou 2009; Milton 2010).
var vocabLevelCeilings = []struct {
	below int
	level Level
}{
	{1500, LevelA1},
	{2500, LevelA2},
	{3250, LevelB1},
	{3750, LevelB2},
}

// EstimateVocab دامنه‌ی لغت را از پاسخ‌ها برآورد می‌کند: برای هر لایه، نسبت
// «بله» منهای نرخ «بله» به کلمه‌های ساختگی (اصلاح حدس، Huibregtse et al. 2002)،
// ضرب در ۱۰۰۰. لایه‌ای که نشان داده نشده (تطبیقی) صفر حساب می‌شود.
func EstimateVocab(answers []VocabAnswer) VocabResult {
	var pseudoTotal, pseudoYes int
	shown := map[int]int{}
	known := map[int]int{}
	for _, a := range answers {
		if a.IsPseudo {
			pseudoTotal++
			if a.Known {
				pseudoYes++
			}
			continue
		}
		if a.Band < 1 || a.Band > 5 {
			continue
		}
		shown[a.Band]++
		if a.Known {
			known[a.Band]++
		}
	}

	falseAlarm := 0.0
	if pseudoTotal > 0 {
		falseAlarm = float64(pseudoYes) / float64(pseudoTotal)
	}

	size := 0.0
	for band := 1; band <= 5; band++ {
		if shown[band] == 0 {
			continue
		}
		hit := float64(known[band]) / float64(shown[band])
		// h - f به‌جای h: کسی که به همه‌چیز «بله» بگوید، صفر می‌گیرد.
		corrected := hit - falseAlarm
		if corrected < 0 {
			corrected = 0
		}
		size += corrected * wordsPerBand
	}

	n := int(math.Round(size/50) * 50) // گرد به ۵۰ تا عدد دقیقِ ساختگی نشان ندهیم
	return VocabResult{
		Size:  n,
		Level: VocabSizeToLevel(n),
		Valid: pseudoTotal == 0 || falseAlarm <= maxPseudoYesRate,
	}
}

// VocabSizeToLevel دامنه‌ی لغت را به سطح نگاشت می‌کند.
func VocabSizeToLevel(size int) Level {
	for _, c := range vocabLevelCeilings {
		if size < c.below {
			return c.level
		}
	}
	return LevelC1
}

// LevelAnswer پاسخ به یک آیتم شنیدن یا تکرار، با سطح آن آیتم.
type LevelAnswer struct {
	Level  Level
	Passed bool
}

// HighestPassedLevel بالاترین سطحی را برمی‌گرداند که کاربر در آن قبول شده:
// دست‌کم دوسوم آیتم‌های نشان‌داده‌شده‌ی آن سطح (۲ از ۳؛ برای سطحی با یک آیتم،
// همان یکی). اگر در هیچ سطحی قبول نشده باشد A1 (پایین‌ترین مسیر).
func HighestPassedLevel(answers []LevelAnswer) Level {
	total := map[Level]int{}
	passed := map[Level]int{}
	for _, a := range answers {
		if a.Level.Rank() < 0 {
			continue
		}
		total[a.Level]++
		if a.Passed {
			passed[a.Level]++
		}
	}
	best := LevelA1
	for _, l := range Levels {
		if total[l] == 0 {
			continue
		}
		if float64(passed[l])/float64(total[l]) >= 2.0/3.0-1e-9 {
			best = l
		}
	}
	return best
}

// HighestAnyPassedLevel بالاترین سطحی که دست‌کم یک آیتمش قبول شده؛ برای
// تکرار جمله که هر سطح یک جمله‌ی خودش را دارد (و C1 دو جمله که هر کدام کافی
// است). اگر هیچ جمله‌ای قبول نشده A1.
func HighestAnyPassedLevel(answers []LevelAnswer) Level {
	best := LevelA1
	for _, a := range answers {
		if a.Passed && a.Level.Rank() > best.Rank() {
			best = a.Level
		}
	}
	return best
}

// ImitationPassAccuracy حداقل دقت کلمه برای قبول شدن یک جمله‌ی تکرار.
const ImitationPassAccuracy = 0.8

// WordAccuracy سهم کلمه‌های جمله‌ی هدف که به همان ترتیب در transcript آمده‌اند
// (طولانی‌ترین زیردنباله‌ی مشترک). لهجه و تلفظ در آن اثری ندارد؛ فقط اینکه
// کاربر کلمه‌ها را درست و کامل گفته یا نه.
func WordAccuracy(target, transcript string) float64 {
	t := normalizeWords(target)
	if len(t) == 0 {
		return 0
	}
	h := normalizeWords(transcript)
	if len(h) == 0 {
		return 0
	}
	prev := make([]int, len(h)+1)
	cur := make([]int, len(h)+1)
	for i := 1; i <= len(t); i++ {
		for j := 1; j <= len(h); j++ {
			switch {
			case t[i-1] == h[j-1]:
				cur[j] = prev[j-1] + 1
			case prev[j] >= cur[j-1]:
				cur[j] = prev[j]
			default:
				cur[j] = cur[j-1]
			}
		}
		prev, cur = cur, prev
	}
	return float64(prev[len(h)]) / float64(len(t))
}

// contractions فرم‌های کوتاه رایج را باز می‌کند تا «I'd» و «I would» یکی حساب شوند.
var contractions = map[string][]string{
	"i'm": {"i", "am"}, "you're": {"you", "are"}, "we're": {"we", "are"}, "they're": {"they", "are"},
	"he's": {"he", "is"}, "she's": {"she", "is"}, "it's": {"it", "is"}, "that's": {"that", "is"},
	"i've": {"i", "have"}, "you've": {"you", "have"}, "we've": {"we", "have"}, "they've": {"they", "have"},
	"i'd": {"i", "would"}, "you'd": {"you", "would"}, "we'd": {"we", "would"}, "they'd": {"they", "would"},
	"he'd": {"he", "would"}, "she'd": {"she", "would"},
	"i'll": {"i", "will"}, "you'll": {"you", "will"}, "we'll": {"we", "will"}, "they'll": {"they", "will"},
	"he'll": {"he", "will"}, "she'll": {"she", "will"}, "it'll": {"it", "will"},
	"don't": {"do", "not"}, "doesn't": {"does", "not"}, "didn't": {"did", "not"},
	"can't": {"can", "not"}, "couldn't": {"could", "not"}, "won't": {"will", "not"},
	"wouldn't": {"would", "not"}, "isn't": {"is", "not"}, "aren't": {"are", "not"},
	"wasn't": {"was", "not"}, "weren't": {"were", "not"}, "haven't": {"have", "not"},
	"hasn't": {"has", "not"}, "hadn't": {"had", "not"}, "shouldn't": {"should", "not"},
	"let's": {"let", "us"},
}

func normalizeWords(s string) []string {
	s = strings.ToLower(strings.ReplaceAll(s, "’", "'"))
	fields := strings.FieldsFunc(s, func(r rune) bool {
		return !(unicode.IsLetter(r) || unicode.IsDigit(r) || r == '\'')
	})
	out := make([]string, 0, len(fields))
	for _, f := range fields {
		f = strings.Trim(f, "'")
		if f == "" {
			continue
		}
		if exp, ok := contractions[f]; ok {
			out = append(out, exp...)
			continue
		}
		out = append(out, f)
	}
	return out
}

// PlacementDecision نتیجه‌ی نهایی تست نسخه‌ی ۲.
type PlacementDecision struct {
	Comprehension Level
	Speaking      Level
	Start         Level // سطح شروع مسیر
}

// DecidePlacement سطح شروع را می‌سازد: فهمیدن = پایین‌ترِ لغت و شنیدن (اگر
// بخش لغت معتبر نبود، فقط شنیدن)؛ شروع = فهمیدن، مگر اینکه صحبت دو سطح یا
// بیشتر پایین‌تر باشد که آن‌وقت یک سطح پایین‌تر از فهمیدن.
func DecidePlacement(vocab VocabResult, listening, speaking Level) PlacementDecision {
	comp := listening
	if vocab.Valid && vocab.Level.Rank() < comp.Rank() {
		comp = vocab.Level
	}
	start := comp
	if comp.Rank()-speaking.Rank() >= 2 {
		start = Levels[comp.Rank()-1]
	}
	return PlacementDecision{Comprehension: comp, Speaking: speaking, Start: start}
}
