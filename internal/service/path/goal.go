package pathservice

import (
	"context"
	"math"
	"sort"
	"time"

	"shadowing-backend/internal/pkg/richerror"
	postgrespath "shadowing-backend/internal/repository/postgres/path"
)

// مسیر هدف‌محور؛ فرمول و اصل صداقت در document_goal_path/goal_path_design.md.

type GoalSituation = postgrespath.GoalSituation
type GoalPlan = postgrespath.GoalPlan
type GoalExtra = postgrespath.GoalExtra

var validGoals = map[string]bool{"travel": true, "migration": true, "study": true, "work": true}
var validMinutes = map[int]bool{15: true, 30: true, 45: true, 60: true}

// sceneLevels ترتیب سطح صحنه‌ها و ساعت آموزش لازم تا سطح بعد (تقریبی، Cambridge guided hours).
var sceneLevels = []string{"starter", "beginner", "intermediate", "advanced", "proficient"}
var gapHoursToNext = map[string]float64{"starter": 100, "beginner": 175, "intermediate": 175, "advanced": 200}

const (
	practiceDaysPerWeek = 6.0
	hoursPerSituation   = 0.75 // ≈۴۵ دقیقه: شدوینگ ۲۰ + جمله‌های ضعیف ۱۰ + گفتاری ۱۰ + لایتنر ۵
)

func levelRank(l string) int {
	for i, v := range sceneLevels {
		if v == l {
			return i
		}
	}
	return -1
}

// GoalForecast پیش‌بینی صادقانه تا تاریخ کاربر.
type GoalForecast struct {
	DaysLeft         int     `json:"days_left"`
	HoursAvailable   float64 `json:"hours_available"`
	GoalShare        float64 `json:"goal_share"`
	SituationsTarget int     `json:"situations_target"`
	SituationsTotal  int     `json:"situations_total"`
	NextLevel        string  `json:"next_level,omitempty"`
	GapHours         int     `json:"gap_hours,omitempty"`
	// LevelReachable فقط وقتی true است که ساعت باقی‌مانده‌ی مسیر عمومی به سطح بعد برسد.
	LevelReachable   bool `json:"level_reachable"`
	LevelProgressPct int  `json:"level_progress_pct"`
}

// goalShare سهم بسته‌ی هدف از وقت، بر اساس فاصله تا تاریخ.
func goalShare(daysLeft int) float64 {
	switch {
	case daysLeft <= 8*7:
		return 0.7
	case daysLeft <= 24*7:
		return 0.4
	default:
		return 0.25
	}
}

// ComputeForecast خالص و بدون I/O است (تست‌پذیر).
func ComputeForecast(startLevel string, daysLeft, minutesPerDay, packSize int) GoalForecast {
	if daysLeft < 0 {
		daysLeft = 0
	}
	hours := float64(daysLeft) * practiceDaysPerWeek / 7 * float64(minutesPerDay) / 60
	share := goalShare(daysLeft)
	n := int(math.Floor(hours * share / hoursPerSituation))
	if n > packSize {
		n = packSize
	}
	f := GoalForecast{
		DaysLeft:         daysLeft,
		HoursAvailable:   math.Round(hours*10) / 10,
		GoalShare:        share,
		SituationsTarget: n,
		SituationsTotal:  packSize,
	}
	if gap, ok := gapHoursToNext[startLevel]; ok {
		f.NextLevel = sceneLevels[levelRank(startLevel)+1]
		f.GapHours = int(gap)
		general := hours * (1 - share)
		f.LevelReachable = general >= gap
		pct := int(math.Round(general / gap * 100))
		if pct > 100 {
			pct = 100
		}
		f.LevelProgressPct = pct
	}
	return f
}

// SituationView یک موقعیت برای کاربر.
type SituationView struct {
	ID         string `json:"id"`
	TitleFa    string `json:"title_fa"`
	Priority   int    `json:"priority"`
	SceneID    string `json:"scene_id,omitempty"`
	SceneLevel string `json:"scene_level,omitempty"`
	SceneImage string `json:"scene_image_url,omitempty"`
	HasContent bool   `json:"has_content"`
	InPlan     bool   `json:"in_plan"`
	Ready      bool   `json:"ready"`
}

// GoalExtraView یک تمرین غیرصحنه‌ای هدف (پادکست، صحبت، نوشتن) برای کاربر.
type GoalExtraView struct {
	Kind     string `json:"kind"` // podcast | topic | writing
	ID       string `json:"id"`
	Title    string `json:"title"`
	Subtitle string `json:"subtitle,omitempty"`
	Level    string `json:"level"`
	ImageURL string `json:"image_url,omitempty"`
	Done     bool   `json:"done"`
}

type GoalPlanView struct {
	Plan       GoalPlan        `json:"plan"`
	Forecast   *GoalForecast   `json:"forecast,omitempty"`
	Situations []SituationView `json:"situations"`
	Ready      int             `json:"ready"`
	InPlanCnt  int             `json:"in_plan_count"`
	TodayID    string          `json:"today_id,omitempty"`
	// Extras تمرین‌های غیرصحنه‌ای همین هدف تا سطح کاربر؛ TodayExtra یکی از آن‌ها برای
	// کار امروز، فقط وقتی کاربر روزی ۳۰ دقیقه یا بیشتر گذاشته (قالب جلسه در طرح).
	Extras     []GoalExtraView `json:"extras"`
	TodayExtra *GoalExtraView  `json:"today_extra,omitempty"`
}

// pickTodayExtra هر روز یک نوع (شنیدن، صحبت، نوشتن) را به نوبت پیشنهاد می‌دهد؛
// اگر از آن نوع تمرین انجام‌نشده نبود، اولین تمرین انجام‌نشده‌ی هر نوعی.
func pickTodayExtra(extras []GoalExtraView, day int) *GoalExtraView {
	kinds := []string{"podcast", "topic", "writing"}
	want := kinds[day%len(kinds)]
	var fallback *GoalExtraView
	for i := range extras {
		x := &extras[i]
		if x.Done {
			continue
		}
		if x.Kind == want {
			return x
		}
		if fallback == nil {
			fallback = x
		}
	}
	return fallback
}

// pickScene بهترین صحنه‌ی منتشرشده برای سطح کاربر: هم‌سطح، وگرنه نزدیک‌ترین (پایین‌تر ارجح).
func pickScene(ids []string, infos map[string]postgrespath.SceneInfo, level string) (string, string) {
	want := levelRank(level)
	best, bestLevel, bestDist := "", "", 1<<30
	for _, id := range ids {
		si, ok := infos[id]
		if !ok || !si.Published {
			continue
		}
		d := (levelRank(si.Level) - want) * 2
		if d < 0 {
			d = -d - 1 // پایین‌تر کمی ارجح‌تر از بالاتر
		}
		if d < bestDist {
			best, bestLevel, bestDist = id, si.Level, d
		}
	}
	return best, bestLevel
}

// InGoalPlan می‌گوید آیا sceneID همان صحنه‌ای است که برنامه‌ی هدف کاربر برای یکی از
// موقعیت‌هایش انتخاب کرده. موقعیتی که صحنه‌ی هم‌سطح ندارد صحنه‌ی سطح بالاتر می‌گیرد و
// قفل سطح نباید جلوی بازشدن آن را بگیرد.
func (s *Service) InGoalPlan(ctx context.Context, userID, sceneID string) (bool, error) {
	plan, err := s.repo.GetGoalPlan(ctx, userID)
	if err != nil || plan == nil {
		return false, err
	}
	pack, err := s.repo.GoalPack(ctx, plan.Goal)
	if err != nil {
		return false, err
	}
	for _, sit := range pack {
		listed := false
		for _, id := range sit.SceneIDs {
			if id == sceneID {
				listed = true
				break
			}
		}
		if !listed {
			continue
		}
		infos, err := s.repo.SceneInfos(ctx, sit.SceneIDs)
		if err != nil {
			return false, err
		}
		if picked, _ := pickScene(sit.SceneIDs, infos, plan.StartLevel); picked == sceneID {
			return true, nil
		}
	}
	return false, nil
}

// GoalPlan برنامه‌ی کاربر با پیش‌بینی و وضعیت موقعیت‌ها؛ nil یعنی برنامه نساخته.
func (s *Service) GoalPlan(ctx context.Context, userID string) (*GoalPlanView, error) {
	const op = "path.GoalPlan"
	if err := parseID(op, userID); err != nil {
		return nil, err
	}
	plan, err := s.repo.GetGoalPlan(ctx, userID)
	if err != nil || plan == nil {
		return nil, err
	}
	pack, err := s.repo.GoalPack(ctx, plan.Goal)
	if err != nil {
		return nil, err
	}
	all := []string{}
	for _, sit := range pack {
		all = append(all, sit.SceneIDs...)
	}
	infos, err := s.repo.SceneInfos(ctx, all)
	if err != nil {
		return nil, err
	}
	done, err := s.repo.CompletedScenes(ctx, userID, all)
	if err != nil {
		return nil, err
	}

	view := &GoalPlanView{Plan: *plan, Situations: make([]SituationView, 0, len(pack))}
	for _, sit := range pack {
		sv := SituationView{ID: sit.ID, TitleFa: sit.TitleFa, Priority: sit.Priority}
		sv.SceneID, sv.SceneLevel = pickScene(sit.SceneIDs, infos, plan.StartLevel)
		sv.SceneImage = infos[sv.SceneID].ImageURL
		sv.HasContent = sv.SceneID != ""
		for _, id := range sit.SceneIDs {
			if done[id] {
				sv.Ready = true
			}
		}
		view.Situations = append(view.Situations, sv)
	}

	// ترتیب فوریت (اولویت، سپس جایگاه)؛ موقعیت‌های بیرون از ظرفیت برنامه in_plan=false می‌گیرند.
	order := make([]int, len(view.Situations))
	for i := range order {
		order[i] = i
	}
	sort.SliceStable(order, func(a, b int) bool {
		return view.Situations[order[a]].Priority < view.Situations[order[b]].Priority
	})
	capacity := len(view.Situations)
	if plan.TargetDate != nil {
		days := int(math.Ceil(time.Until(*plan.TargetDate).Hours() / 24))
		f := ComputeForecast(plan.StartLevel, days, plan.MinutesPerDay, len(view.Situations))
		view.Forecast = &f
		capacity = f.SituationsTarget
	}
	for rank, idx := range order {
		sv := &view.Situations[idx]
		sv.InPlan = rank < capacity
		if sv.InPlan {
			view.InPlanCnt++
			if sv.Ready {
				view.Ready++
			}
			if view.TodayID == "" && !sv.Ready && sv.HasContent {
				view.TodayID = sv.ID
			}
		}
	}

	extras, err := s.goalExtras(ctx, userID, plan)
	if err != nil {
		return nil, err
	}
	view.Extras = extras
	if plan.MinutesPerDay >= 30 {
		if x := pickTodayExtra(view.Extras, time.Now().YearDay()); x != nil {
			cp := *x
			view.TodayExtra = &cp
		}
	}
	return view, nil
}

// goalExtras تمرین‌های فعالِ هدف تا سطح کاربر، به ترتیبی که ادمین چیده.
func (s *Service) goalExtras(ctx context.Context, userID string, plan *GoalPlan) ([]GoalExtraView, error) {
	items, err := s.repo.GoalExtras(ctx, plan.Goal)
	if err != nil || len(items) == 0 {
		return []GoalExtraView{}, err
	}
	infos, err := s.repo.GoalExtraInfos(ctx, userID, items)
	if err != nil {
		return nil, err
	}
	maxRank := levelRank(plan.StartLevel)
	out := make([]GoalExtraView, 0, len(items))
	for _, it := range items {
		info, ok := infos[it.Kind+":"+it.RefID]
		if !ok || !info.Active {
			continue
		}
		if r := levelRank(info.Level); maxRank >= 0 && r > maxRank {
			continue
		}
		out = append(out, GoalExtraView{
			Kind: it.Kind, ID: it.RefID, Title: info.Title, Subtitle: info.Subtitle,
			Level: info.Level, ImageURL: info.ImageURL, Done: info.Done,
		})
	}
	return out, nil
}

type SaveGoalPlanInput struct {
	Goal          string `json:"goal"`
	TargetDate    string `json:"target_date"` // YYYY-MM-DD یا خالی
	MinutesPerDay int    `json:"minutes_per_day"`
	StartLevel    string `json:"start_level"`
}

func (s *Service) SaveGoalPlan(ctx context.Context, userID string, in SaveGoalPlanInput) (*GoalPlanView, error) {
	const op = "path.SaveGoalPlan"
	if err := parseID(op, userID); err != nil {
		return nil, err
	}
	if !validGoals[in.Goal] {
		return nil, invalid(op, "هدف نامعتبر است")
	}
	if !validMinutes[in.MinutesPerDay] {
		return nil, invalid(op, "دقیقه در روز باید ۱۵، ۳۰، ۴۵ یا ۶۰ باشد")
	}
	if levelRank(in.StartLevel) < 0 {
		return nil, invalid(op, "سطح شروع نامعتبر است")
	}
	p := GoalPlan{Goal: in.Goal, MinutesPerDay: in.MinutesPerDay, StartLevel: in.StartLevel}
	if in.TargetDate != "" {
		d, err := time.Parse("2006-01-02", in.TargetDate)
		if err != nil {
			return nil, invalid(op, "تاریخ نامعتبر است")
		}
		if d.Before(time.Now().Truncate(24 * time.Hour)) {
			return nil, invalid(op, "تاریخ باید در آینده باشد")
		}
		p.TargetDate = &d
	}
	if err := s.repo.SaveGoalPlan(ctx, userID, p); err != nil {
		return nil, err
	}
	return s.GoalPlan(ctx, userID)
}

func (s *Service) DeleteGoalPlan(ctx context.Context, userID string) error {
	if err := parseID("path.DeleteGoalPlan", userID); err != nil {
		return err
	}
	return s.repo.DeleteGoalPlan(ctx, userID)
}

// ---------- ادمین ----------

func (s *Service) AdminGoalPack(ctx context.Context, goal string) ([]GoalSituation, error) {
	if !validGoals[goal] {
		return nil, invalid("path.AdminGoalPack", "هدف نامعتبر است")
	}
	return s.repo.GoalPack(ctx, goal)
}

func (s *Service) AdminSaveGoalPack(ctx context.Context, goal string, items []GoalSituation) error {
	const op = "path.AdminSaveGoalPack"
	if !validGoals[goal] {
		return invalid(op, "هدف نامعتبر است")
	}
	seen := map[int]bool{}
	for i := range items {
		it := &items[i]
		if it.TitleFa == "" {
			return invalid(op, "عنوان فارسی موقعیت لازم است")
		}
		if it.Position == 0 {
			it.Position = i + 1
		}
		if seen[it.Position] {
			return invalid(op, "جایگاه تکراری")
		}
		seen[it.Position] = true
		if it.Priority < 1 || it.Priority > 3 {
			it.Priority = 2
		}
		for _, id := range it.SceneIDs {
			if err := parseID(op, id); err != nil {
				return richerror.New(op).WithMessage("شناسه‌ی صحنه نامعتبر است").WithKind(richerror.KindInvalid)
			}
		}
		if it.SceneIDs == nil {
			it.SceneIDs = []string{}
		}
	}
	return s.repo.SaveGoalPack(ctx, goal, items)
}

var validExtraKinds = map[string]bool{"podcast": true, "topic": true, "writing": true}

func (s *Service) AdminGoalExtras(ctx context.Context, goal string) ([]GoalExtra, error) {
	if !validGoals[goal] {
		return nil, invalid("path.AdminGoalExtras", "هدف نامعتبر است")
	}
	return s.repo.GoalExtras(ctx, goal)
}

// AdminSaveGoalExtras کل فهرست پادکست/صحبت/نوشتنِ یک هدف را جایگزین می‌کند.
func (s *Service) AdminSaveGoalExtras(ctx context.Context, goal string, items []GoalExtra) error {
	const op = "path.AdminSaveGoalExtras"
	if !validGoals[goal] {
		return invalid(op, "هدف نامعتبر است")
	}
	for i := range items {
		it := &items[i]
		if !validExtraKinds[it.Kind] {
			return invalid(op, "نوع باید podcast، topic یا writing باشد")
		}
		if err := parseID(op, it.RefID); err != nil {
			return invalid(op, "شناسه‌ی محتوا نامعتبر است")
		}
		if it.Position == 0 {
			it.Position = i + 1
		}
	}
	return s.repo.SaveGoalExtras(ctx, goal, items)
}
