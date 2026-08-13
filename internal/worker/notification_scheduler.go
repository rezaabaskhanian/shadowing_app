package worker

import (
	"context"
	"log"
	"time"

	notificationservice "shadowing-backend/internal/service/notification"
)

// RunNotificationScheduler هر دقیقه ساعت فعلی را با ساعت یادآوری روزانه‌ی
// کاربران مقایسه می‌کند و برای سررسیده‌ها پوش می‌فرستد. باید به‌صورت
// go worker.RunNotificationScheduler(ctx, svc) از cmd/main.go صدا زده شود.
func RunNotificationScheduler(ctx context.Context, svc notificationservice.Service) {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case now := <-ticker.C:
			hhmm := now.Format("15:04")
			sent, err := svc.SendDueReminders(ctx, hhmm)
			if err != nil {
				log.Println("notification scheduler error:", err)
				continue
			}
			if sent > 0 {
				log.Printf("notification scheduler: sent %d daily reminders at %s\n", sent, hhmm)
			}
		}
	}
}
