package scence

// Category دسته‌بندی ثابت صحنه‌ها — ادمین فقط از همین لیست انتخاب می‌کند (نه
// متن آزاد)، تا فیلتر تب صحنه‌ها و ترجیحِ «هدف یادگیری» در ماموریت امروز
// همیشه روی مقدارهای شناخته‌شده کار کنند.
type Category string

const (
	CategoryMigration Category = "migration"
	CategoryCareer    Category = "career"
	CategoryEducation Category = "education"
	CategoryDaily     Category = "daily"
	CategoryTravel    Category = "travel"
	CategorySocial    Category = "social"
)

var categories = map[Category]bool{
	CategoryMigration: true,
	CategoryCareer:    true,
	CategoryEducation: true,
	CategoryDaily:     true,
	CategoryTravel:    true,
	CategorySocial:    true,
}

func IsValidCategory(v string) bool {
	return categories[Category(v)]
}

// goalCategories هر «هدف یادگیری» کاربر (مقدارهای ثابت تنظیمات اپ) را به
// دسته‌هایی نگاشت می‌کند که ماموریت امروز برایش ترجیح می‌دهد.
var goalCategories = map[string][]Category{
	"Migration":  {CategoryMigration},
	"Travel":     {CategoryTravel},
	"Work":       {CategoryCareer},
	"Study":      {CategoryEducation},
	"Daily Life": {CategoryDaily, CategorySocial},
}

// MatchesGoal می‌گوید آیا دسته‌ی یک صحنه با هدف یادگیری کاربر جور است.
func MatchesGoal(category, goal string) bool {
	for _, c := range goalCategories[goal] {
		if Category(category) == c {
			return true
		}
	}
	return false
}
