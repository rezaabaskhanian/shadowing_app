package notificationservice

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
)

const maxLeitnerLevelDigest = 5

type digestSkillScore struct {
	label string
	score float64
}

// weakestSkillLabel همان منطقِ ۴-تاییِ computeFocusSkill در missionservice
// (بخش «Advanced Personalization» سند محصول) را برای این گزارش تکرار می‌کند
// — import مستقیم از آن سرویس نشده چون شکلِ وابستگی‌هایش فرق دارد. فقط
// مهارتی وارد مقایسه می‌شود که داده‌ی واقعی پشتش باشد، تا صفرِ ناشی از
// «هنوز داده‌ای نیست» به‌غلط «ضعیف‌ترین مهارت» گزارش نشود.
func (s Service) weakestSkillLabel(ctx context.Context, userID uuid.UUID) string {
	var available []digestSkillScore

	if pron, flu, err := s.recording.AvgScoresByUser(ctx, userID); err == nil {
		if !(pron == 0 && flu == 0) {
			available = append(available,
				digestSkillScore{"تلفظ", pron},
				digestSkillScore{"روانی صحبت", flu},
			)
		}
	}
	if avgLevel, wordCount, err := s.leitner.AvgLevelByUser(ctx, userID); err == nil && wordCount > 0 {
		available = append(available, digestSkillScore{"دایره‌ی واژگان", avgLevel / maxLeitnerLevelDigest * 100})
	}
	if clean, total, err := s.grammar.CleanRate(ctx, userID); err == nil && total > 0 {
		available = append(available, digestSkillScore{"گرامر", float64(clean) / float64(total) * 100})
	}

	if len(available) == 0 {
		return ""
	}
	weakest := available[0]
	for _, sk := range available[1:] {
		if sk.score < weakest.score {
			weakest = sk
		}
	}
	return weakest.label
}

// SendWeeklyDigests به کاربرانی که گزارش هفتگی را روشن کرده‌اند، خلاصه‌ی
// هفته‌ی کاملاً تمام‌شده‌ی قبل را می‌فرستد — نه هفته‌ی در حال گذر، که هنوز
// داده‌ی معنادار ندارد. برخلاف SendStreakReminders/SendVocabReminders (یک
// پیام ثابت برای همه)، این پیام شخصی‌سازی‌شده است، پس هر کاربر جداگانه
// پردازش و ارسال می‌شود. مثل بقیه‌ی جاب‌های نوتیفیکیشن، از یک اجرای
// زمان‌بندی‌شده (cmd/main.go) صدا زده می‌شود.
func (s Service) SendWeeklyDigests(ctx context.Context) (int, error) {
	if !s.push.Enabled() {
		return 0, nil
	}
	userIDs, err := s.repo.WeeklyDigestOptedInUserIDs(ctx)
	if err != nil {
		return 0, err
	}

	sent := 0
	for _, userID := range userIDs {
		weeks, err := s.recording.TrendByUser(ctx, userID)
		if err != nil || len(weeks) < 2 {
			continue
		}

		// weeks آخرین عضوش «هفته‌ی در حال گذر» است (همیشه تقریباً بدون
		// داده، چون این جاب اول هفته اجرا می‌شود)؛ عضوِ ماقبل‌آخر، آخرین
		// هفته‌ی واقعاً تمام‌شده است — همان چیزی که این گزارش راجع به آن
		// صحبت می‌کند.
		lastCompleted := weeks[len(weeks)-2]
		if lastCompleted.Sessions == 0 {
			// هیچ فعالیتی نبوده — چیزی واقعی برای گزارش نیست. گزارشِ جعلی/
			// دلسردکننده نمی‌فرستیم؛ نگه‌داشتنِ کاربرِ راکد کارِ یادآوری
			// استریک است، نه این گزارش.
			continue
		}

		body := fmt.Sprintf("این هفته %d جلسه تمرین کردی، امتیاز گفتاریت %d بود.", lastCompleted.Sessions, lastCompleted.Speaking)
		if len(weeks) >= 3 {
			if prev := weeks[len(weeks)-3]; prev.Sessions > 0 {
				delta := lastCompleted.Speaking - prev.Speaking
				switch {
				case delta > 0:
					body += fmt.Sprintf(" نسبت به هفته‌ی قبل %d امتیاز پیشرفت کردی 🎉", delta)
				case delta < 0:
					body += fmt.Sprintf(" نسبت به هفته‌ی قبل %d امتیاز افت داشتی.", -delta)
				default:
					body += " دقیقاً هم‌سطح هفته‌ی قبل موندی."
				}
			}
		}
		if weak := s.weakestSkillLabel(ctx, userID); weak != "" {
			body += fmt.Sprintf(" ضعیف‌ترین مهارتت الان %s هست — روش تمرکز کن.", weak)
		}

		tokens, err := s.repo.TokensForUser(ctx, userID.String())
		if err != nil || len(tokens) == 0 {
			continue
		}
		n, err := s.push.SendToTokens(ctx, tokens, "گزارش هفتگیِ گفتارت 📊", body)
		if err != nil {
			slog.Warn("notification: failed to send weekly digest", "user_id", userID, "err", err)
			continue
		}
		sent += n
	}
	return sent, nil
}
