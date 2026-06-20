package achievement

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Achievement - دستاورد کاربر
type Achievement struct {
	ID          uuid.UUID         `json:"id"`
	UserID      uuid.UUID         `json:"user_id"`
	Type        AchievementType   `json:"type"`
	Rarity      AchievementRarity `json:"rarity"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Icon        string            `json:"icon"`
	XP          int               `json:"xp"` // امتیاز جایزه
	UnlockedAt  *time.Time        `json:"unlocked_at,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
}

// ============================================
// تعریف دستاوردهای از پیش تعیین‌شده
// ============================================
var AchievementDefinitions = map[AchievementType]struct {
	Name        string
	Description string
	Icon        string
	Rarity      AchievementRarity
	XP          int
}{
	AchievementFirstLesson: {
		Name:        "اولین قدم",
		Description: "اولین درس خود را کامل کردی!",
		Icon:        "🌟",
		Rarity:      RarityCommon,
		XP:          10,
	},
	AchievementPerfectScore: {
		Name:        "نمره کامل",
		Description: "در یک درس نمره ۱۰۰ گرفتی!",
		Icon:        "💯",
		Rarity:      RarityUncommon,
		XP:          25,
	},
	AchievementStreak7: {
		Name:        "هفته اول",
		Description: "۷ روز متوالی تمرین کردی!",
		Icon:        "🔥",
		Rarity:      RarityRare,
		XP:          50,
	},
	AchievementStreak30: {
		Name:        "یک ماه تعهد",
		Description: "۳۰ روز متوالی تمرین کردی!",
		Icon:        "🏆",
		Rarity:      RarityEpic,
		XP:          100,
	},
}

// ============================================
// سازنده Achievement جدید
// ============================================
func NewAchievement(userID uuid.UUID, achType AchievementType) (*Achievement, error) {
	if userID == uuid.Nil {
		return nil, errors.New("user ID is required")
	}

	def, exists := AchievementDefinitions[achType]
	if !exists {
		return nil, errors.New("achievement type not found")
	}

	now := time.Now()
	return &Achievement{
		ID:          uuid.New(),
		UserID:      userID,
		Type:        achType,
		Rarity:      def.Rarity,
		Name:        def.Name,
		Description: def.Description,
		Icon:        def.Icon,
		XP:          def.XP,
		UnlockedAt:  &now,
		CreatedAt:   now,
	}, nil
}
