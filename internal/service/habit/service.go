package habitservice

import (
	"context"
	"log/slog"
	"os"
	"strings"

	"shadowing-backend/internal/domain/habit/mission"
	"shadowing-backend/internal/pkg/audio"
	"shadowing-backend/internal/pkg/richerror"
	posthabit "shadowing-backend/internal/repository/postgres/habit"
	"shadowing-backend/internal/service/habit/dto"
	progressservice "shadowing-backend/internal/service/progress"
	progressdto "shadowing-backend/internal/service/progress/dto"
	"shadowing-backend/internal/service/speecheval"

	"github.com/google/uuid"
)

type repository interface {
	ListActivities(ctx context.Context) ([]posthabit.Activity, error)
	GetActivity(ctx context.Context, id uuid.UUID) (posthabit.Activity, error)
	RandomActivity(ctx context.Context) (posthabit.Activity, error)
	CreateMission(ctx context.Context, userID, hotspotID, activityID uuid.UUID, missionType string) (mission.Mission, error)
	GetMission(ctx context.Context, id uuid.UUID) (mission.Mission, error)
	StartMission(ctx context.Context, id uuid.UUID) error
	CompleteMission(ctx context.Context, id uuid.UUID, duration int) error
	CreateSession(ctx context.Context, missionID, userID uuid.UUID, audioPath, transcript string, duration int) (uuid.UUID, error)
	CreateResult(ctx context.Context, sessionID, hotspotID uuid.UUID, matchedSentences, totalSentences, matchedWords, totalWords int, accuracy float64) error
	ListUserMissions(ctx context.Context, userID uuid.UUID, limit int) ([]mission.Mission, error)
	HistoryStats(ctx context.Context, userID uuid.UUID) (int, int, error)
	DialogueLinesByHotspot(ctx context.Context, hotspotID uuid.UUID) ([]posthabit.DialogueLine, error)
	SuggestHotspot(ctx context.Context, userID uuid.UUID) (uuid.UUID, error)
	FindActiveMission(ctx context.Context, userID uuid.UUID) (mission.Mission, bool, error)
}

// avgWordsPerSecond تخمین ساده برای مدت زمان تمرین یک دیالوگ چندجمله‌ای —
// فقط برای نمایش تخمین به کاربر، نه یک محاسبه‌ی دقیق.
const avgWordsPerSecond = 2.2

type Service struct {
	repo        repository
	progressSvc *progressservice.Service
	whisperURL  string
}

func New(repo repository, progressSvc *progressservice.Service, whisperURL string) Service {
	return Service{repo: repo, progressSvc: progressSvc, whisperURL: whisperURL}
}

func (s Service) ListActivities(ctx context.Context) ([]dto.Activity, error) {
	activities, err := s.repo.ListActivities(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]dto.Activity, 0, len(activities))
	for _, a := range activities {
		out = append(out, toActivityDTO(a))
	}
	return out, nil
}

func toActivityDTO(a posthabit.Activity) dto.Activity {
	return dto.Activity{
		ID: a.ID.String(), Code: a.Code, NameEN: a.NameEN, NameFA: a.NameFA, Icon: a.Icon,
	}
}

// TodayMission ماموریت عادت امروز کاربر را برمی‌گرداند: اگر ماموریتی
// assigned/in_progress از قبل وجود داشته باشد همان استفاده می‌شود (تا هر بار
// باز کردن صفحه یک ماموریت تازه در هات‌اسپات دیگری نسازد)، وگرنه یک ماموریت
// تازه بر اساس یک موقعیت واقعی روزمره (مثلاً موقع ریختن قهوه) ساخته می‌شود.
func (s Service) TodayMission(ctx context.Context, userID string) (dto.TodayMissionResponse, error) {
	const op = "habit.TodayMission"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return dto.TodayMissionResponse{}, richerror.New(op).WithErr(err).WithMessage("شناسه کاربر نامعتبر است")
	}

	m, found, err := s.repo.FindActiveMission(ctx, uid)
	if err != nil {
		return dto.TodayMissionResponse{}, richerror.New(op).WithErr(err)
	}

	if !found {
		hotspotID, err := s.repo.SuggestHotspot(ctx, uid)
		if err != nil {
			return dto.TodayMissionResponse{}, richerror.New(op).WithErr(err).WithMessage("پیشنهادی برای امروز پیدا نشد")
		}

		activity, err := s.repo.RandomActivity(ctx)
		if err != nil {
			return dto.TodayMissionResponse{}, richerror.New(op).WithErr(err).WithMessage("فعالیتی برای پیشنهاد وجود ندارد")
		}

		m, err = s.repo.CreateMission(ctx, uid, hotspotID, activity.ID, string(mission.TypeRealLife))
		if err != nil {
			return dto.TodayMissionResponse{}, richerror.New(op).WithErr(err)
		}
	}

	activity, err := s.repo.GetActivity(ctx, m.ActivityID)
	if err != nil {
		return dto.TodayMissionResponse{}, richerror.New(op).WithErr(err)
	}

	lines, err := s.repo.DialogueLinesByHotspot(ctx, m.HotspotID)
	if err != nil {
		return dto.TodayMissionResponse{}, richerror.New(op).WithErr(err)
	}

	dialogues := make([]dto.DialogueLineDTO, 0, len(lines))
	totalWords := 0
	for _, l := range lines {
		dialogues = append(dialogues, dto.DialogueLineDTO{Order: l.Order, Speaker: l.Speaker, OriginalText: l.OriginalText})
		totalWords += len(strings.Fields(l.OriginalText))
	}

	estimated := int(float64(totalWords) / avgWordsPerSecond)
	if estimated < 15 {
		estimated = 15
	}

	return dto.TodayMissionResponse{
		MissionID:       m.ID.String(),
		HotspotID:       m.HotspotID.String(),
		MissionType:     string(m.Type),
		Status:          string(m.Status),
		Activity:        toActivityDTO(activity),
		Dialogues:       dialogues,
		EstimatedSecond: estimated,
	}, nil
}

func (s Service) StartMission(ctx context.Context, missionID, userID string) error {
	const op = "habit.StartMission"

	mid, err := uuid.Parse(missionID)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("شناسه ماموریت نامعتبر است")
	}

	m, err := s.repo.GetMission(ctx, mid)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	if m.UserID.String() != userID {
		return richerror.New(op).WithMessage("این ماموریت متعلق به شما نیست").WithKind(richerror.KindInvalid)
	}

	return s.repo.StartMission(ctx, mid)
}

// SubmitSession جلسه‌ی تمرین عادت کاربر را ثبت می‌کند: اگر سرویس تشخیص گفتار
// در دسترس باشد رونوشت گفته‌شده با متن دیالوگ‌های هدف مقایسه می‌شود؛ در غیر
// این صورت (WHISPER_URL خالی یا سرویس در دسترس نیست) طبق تصمیم محصول، تمرین
// همچنان به‌عنوان انجام‌شده ثبت می‌شود، فقط بدون نمره‌ی دقت — چون هدف اصلی
// تمرین یادآوری خودکار است، نه گیر افتادن کاربر پشت یک سرویس جانبی.
func (s Service) SubmitSession(ctx context.Context, missionID, userID, audioPath string, durationSeconds int) (dto.SubmitSessionResponse, error) {
	const op = "habit.SubmitSession"

	mid, err := uuid.Parse(missionID)
	if err != nil {
		return dto.SubmitSessionResponse{}, richerror.New(op).WithErr(err).WithMessage("شناسه ماموریت نامعتبر است")
	}

	m, err := s.repo.GetMission(ctx, mid)
	if err != nil {
		return dto.SubmitSessionResponse{}, richerror.New(op).WithErr(err)
	}
	if m.UserID.String() != userID {
		return dto.SubmitSessionResponse{}, richerror.New(op).WithMessage("این ماموریت متعلق به شما نیست").WithKind(richerror.KindInvalid)
	}

	lines, err := s.repo.DialogueLinesByHotspot(ctx, m.HotspotID)
	if err != nil {
		return dto.SubmitSessionResponse{}, richerror.New(op).WithErr(err)
	}

	transcript := ""
	matchedSentences, totalSentences := 0, len(lines)
	matchedWords, totalWords := 0, 0
	speechEvaluated := false

	for _, l := range lines {
		totalWords += len(normalizeWords(l.OriginalText))
	}

	if s.whisperURL == "" {
		slog.Warn("habit session submitted without whisper evaluation: WHISPER_URL not set")
	} else if audioPath == "" {
		slog.Warn("habit session submitted without audio file")
	} else {
		fullTarget := joinDialogueText(lines)
		wavPath, err := audio.ToWAV16kMono(ctx, audioPath)
		if err != nil {
			slog.Warn("habit session: audio conversion failed, skipping speech evaluation", "err", err)
		} else {
			defer os.Remove(wavPath)

			client := speecheval.NewWhisperClient(s.whisperURL)
			tr, err := client.Transcribe(ctx, wavPath, fullTarget)
			if err != nil {
				slog.Warn("habit session: transcription failed, skipping speech evaluation", "err", err)
			} else {
				speechEvaluated = true
				transcript = tr.Text
				heard := normalizeWords(tr.Text)
				matchedSentences, matchedWords = matchSentences(lines, heard)
			}
		}
	}

	accuracy := 0.0
	if totalWords > 0 {
		accuracy = float64(matchedWords) / float64(totalWords) * 100
	}

	sessionID, err := s.repo.CreateSession(ctx, mid, m.UserID, audioPath, transcript, durationSeconds)
	if err != nil {
		return dto.SubmitSessionResponse{}, richerror.New(op).WithErr(err)
	}

	if err := s.repo.CreateResult(ctx, sessionID, m.HotspotID, matchedSentences, totalSentences, matchedWords, totalWords, accuracy); err != nil {
		return dto.SubmitSessionResponse{}, richerror.New(op).WithErr(err)
	}

	if err := s.repo.CompleteMission(ctx, mid, durationSeconds); err != nil {
		return dto.SubmitSessionResponse{}, richerror.New(op).WithErr(err)
	}

	xp := 10
	if accuracy >= 50 {
		xp = 20
	}
	progressResp, err := s.progressSvc.AddDailyProgress(ctx, progressdto.AddDailyProgressRequest{
		UserID: userID,
		Score:  accuracy,
		XP:     xp,
	})
	streak, totalXP, newAchievements, message := 0, 0, []string{}, ""
	if err != nil {
		slog.Warn("habit session: failed to record daily progress", "err", err)
	} else {
		streak = progressResp.Streak
		totalXP = progressResp.TotalXP
		newAchievements = progressResp.NewAchievements
		message = progressResp.Message
	}

	return dto.SubmitSessionResponse{
		MissionID:        missionID,
		Transcript:       transcript,
		MatchedSentences: matchedSentences,
		TotalSentences:   totalSentences,
		MatchedWords:     matchedWords,
		TotalWords:       totalWords,
		Accuracy:         accuracy,
		DurationSeconds:  durationSeconds,
		Streak:           streak,
		TotalXP:          totalXP,
		NewAchievements:  newAchievements,
		Message:          message,
		SpeechEvaluated:  speechEvaluated,
	}, nil
}

func (s Service) History(ctx context.Context, userID string) (dto.HistoryResponse, error) {
	const op = "habit.History"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return dto.HistoryResponse{}, richerror.New(op).WithErr(err).WithMessage("شناسه کاربر نامعتبر است")
	}

	completedCount, totalDuration, err := s.repo.HistoryStats(ctx, uid)
	if err != nil {
		return dto.HistoryResponse{}, richerror.New(op).WithErr(err)
	}

	missions, err := s.repo.ListUserMissions(ctx, uid, 20)
	if err != nil {
		return dto.HistoryResponse{}, richerror.New(op).WithErr(err)
	}

	currentStreak := 0
	if streakResp, err := s.progressSvc.GetUserStreak(ctx, userID); err == nil {
		currentStreak = streakResp.CurrentStreak
	}

	list := make([]dto.HistoryMissionDTO, 0, len(missions))
	for _, m := range missions {
		item := dto.HistoryMissionDTO{
			MissionID:       m.ID.String(),
			HotspotID:       m.HotspotID.String(),
			MissionType:     string(m.Type),
			Status:          string(m.Status),
			DurationSeconds: m.DurationSeconds,
		}
		if m.CompletedAt != nil {
			item.CompletedAt = m.CompletedAt.Format("2006-01-02T15:04:05Z07:00")
		}
		list = append(list, item)
	}

	return dto.HistoryResponse{
		CompletedCount:       completedCount,
		TotalDurationSeconds: totalDuration,
		CurrentStreak:        currentStreak,
		Missions:             list,
	}, nil
}

// ---------- تطبیق ساده‌ی رونوشت با جمله‌های هدف (بدون نمره‌دهی پیشرفته) ----------

// sentenceMatchThreshold حداقل نسبت کلمه‌های مشترک یک جمله با رونوشت که آن
// جمله را «گفته‌شده» حساب می‌کند.
const sentenceMatchThreshold = 0.6

func matchSentences(lines []posthabit.DialogueLine, heard []string) (matchedSentences, matchedWords int) {
	heardSet := make(map[string]int, len(heard))
	for _, w := range heard {
		heardSet[w]++
	}

	for _, l := range lines {
		target := normalizeWords(l.OriginalText)
		if len(target) == 0 {
			continue
		}
		hits := 0
		for _, w := range target {
			if heardSet[w] > 0 {
				hits++
				heardSet[w]--
			}
		}
		matchedWords += hits
		if float64(hits)/float64(len(target)) >= sentenceMatchThreshold {
			matchedSentences++
		}
	}
	return matchedSentences, matchedWords
}

func joinDialogueText(lines []posthabit.DialogueLine) string {
	parts := make([]string, 0, len(lines))
	for _, l := range lines {
		parts = append(parts, l.OriginalText)
	}
	return strings.Join(parts, " ")
}

// normalizeWords متن را برای مقایسه ساده می‌کند: حروف کوچک، بدون علائم
// نگارشی، جدا شده با فاصله. عمداً ساده نگه داشته شده — این یک MVP است، نه
// نمره‌دهی پیشرفته‌ی تلفظ.
func normalizeWords(text string) []string {
	var b strings.Builder
	for _, r := range strings.ToLower(text) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9', r == ' ':
			b.WriteRune(r)
		default:
			b.WriteRune(' ')
		}
	}
	return strings.Fields(b.String())
}
