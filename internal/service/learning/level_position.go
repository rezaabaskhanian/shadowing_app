package learningservice

import scene "shadowing-backend/internal/domain/learning/scene"

// levelPath صحنه‌های منتشرشده‌ی یک سطح را به ترتیب مسیر برمی‌گرداند (all از
// GetAll از قبل بر اساس "order" و بعد جدیدترین مرتب است — همان ترتیب اپ و
// پنل ادمین). excludeID (صحنه‌ی در حال ویرایش) شمرده نمی‌شود.
func levelPath(all []scene.Scene, difficulty scene.DifficultyLevel, excludeID scene.SceneID) []scene.Scene {
	path := make([]scene.Scene, 0, len(all))
	for _, sc := range all {
		if sc.Status == scene.StatusPublished && sc.Difficulty == difficulty && sc.ID != excludeID {
			path = append(path, sc)
		}
	}
	return path
}

// levelPositionOf جایگاه (از ۱) صحنه در مسیرِ سطح خودش؛ ۰ اگر منتشرشده نباشد.
func levelPositionOf(all []scene.Scene, sc scene.Scene) int {
	for i, p := range levelPath(all, sc.Difficulty, "") {
		if p.ID == sc.ID {
			return i + 1
		}
	}
	return 0
}

// orderForLevelPosition جایگاهِ درون‌سطحی را به "order" سراسری تبدیل می‌کند:
// order همان صحنه‌ای که الان در این جایگاه است (صحنه‌ی جدید جلوی آن درج
// می‌شود و ShiftOrdersFrom بقیه را یکی عقب می‌برد)؛ جایگاهِ بزرگ‌تر از طول
// مسیر یعنی بعد از آخرین صحنه‌ی همین سطح؛ سطحِ بدون صحنه یعنی آخر کل مسیر.
func orderForLevelPosition(all []scene.Scene, difficulty scene.DifficultyLevel, position int, excludeID scene.SceneID) int {
	path := levelPath(all, difficulty, excludeID)
	if position <= len(path) {
		return path[position-1].Order
	}
	if len(path) > 0 {
		return path[len(path)-1].Order + 1
	}
	maxOrder := 0
	for _, sc := range all {
		if sc.Order > maxOrder && sc.ID != excludeID {
			maxOrder = sc.Order
		}
	}
	return maxOrder + 1
}
