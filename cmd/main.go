package main

import (
	"bufio"
	"fmt"
	"os"
	"shadowing-backend/internal/config"
	"shadowing-backend/internal/delivery/httpserver"
	"strconv"
	"strings"

	"shadowing-backend/internal/repository/migrator"
	"shadowing-backend/internal/repository/postgres"

	posthabit "shadowing-backend/internal/repository/postgres/habit"
	postgreslearning "shadowing-backend/internal/repository/postgres/learning"
	postgresleitner "shadowing-backend/internal/repository/postgres/leitner"
	postgresnotification "shadowing-backend/internal/repository/postgres/notification"
	postgresotp "shadowing-backend/internal/repository/postgres/otp"
	postgresachievement "shadowing-backend/internal/repository/postgres/progress/achievement"
	postgresactivity "shadowing-backend/internal/repository/postgres/progress/activity"
	postgresssceneprogress "shadowing-backend/internal/repository/postgres/progress/scene_progress"
	postgressstreak "shadowing-backend/internal/repository/postgres/progress/streak"
	postgressettings "shadowing-backend/internal/repository/postgres/settings"
	postgresrecording "shadowing-backend/internal/repository/postgres/shadowing/recording"
	postgressession "shadowing-backend/internal/repository/postgres/shadowing/session"
	postgressubmission "shadowing-backend/internal/repository/postgres/submission"
	postgressubscription "shadowing-backend/internal/repository/postgres/subscription"
	posttopicsuggestion "shadowing-backend/internal/repository/postgres/topicsuggestion"
	postgresuser "shadowing-backend/internal/repository/postgres/user"

	"shadowing-backend/internal/worker"

	// adminservice "shadowing-backend/internal/service/admin"

	"context"

	authservice "shadowing-backend/internal/service/auth"
	billingservice "shadowing-backend/internal/service/billing"
	habitservice "shadowing-backend/internal/service/habit"
	learningservice "shadowing-backend/internal/service/learning"
	leitnerservice "shadowing-backend/internal/service/leitner"
	notificationservice "shadowing-backend/internal/service/notification"
	otpservice "shadowing-backend/internal/service/otp"
	progressservice "shadowing-backend/internal/service/progress"
	pushservice "shadowing-backend/internal/service/push"
	settingsservice "shadowing-backend/internal/service/settings"
	shadowingservice "shadowing-backend/internal/service/shadowing"
	smsservice "shadowing-backend/internal/service/sms"
	"shadowing-backend/internal/service/speecheval"
	submissionservice "shadowing-backend/internal/service/submission"
	subscriptionservice "shadowing-backend/internal/service/subscription"
	topicsuggestionservice "shadowing-backend/internal/service/topicsuggestion"

	userservice "shadowing-backend/internal/service/user"

	"time"
)

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	n, err := strconv.Atoi(val)
	if err != nil {
		return fallback
	}
	return n
}

func loadEnv(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			val = strings.Trim(val, `"'`)
			os.Setenv(key, val)
		}
	}
}

const (
	AccessTokenSubject  = "as"
	RefreshTokenSubject = "rs"

	AccessTokenExpirationDuration  = time.Hour * 24
	RefreshTokenExpirationDuration = time.Hour * 24 * 7
)

func main() {
	loadEnv(".env")

	cfg := config.Config{

		MyPostgres: postgres.Config{
			UserName: getEnv("DB_USERNAME", "reza_abasi"),
			Password: getEnv("DB_PASSWORD", "r1367R1367"),
			Port:     getEnvInt("DB_PORT", 5435),
			Host:     getEnv("DB_HOST", "localhost"),
			DBName:   getEnv("DB_NAME", "shadowing-backend_db"),
		},
		Auth: authservice.Config{
			SignKey:               getEnv("JWT_SIGN_KEY", "jwt_token"),
			AccessExpirationTime:  AccessTokenExpirationDuration,
			RefreshExpirationTime: RefreshTokenExpirationDuration,

			AccessSubject:  AccessTokenSubject,
			RefreshSubject: RefreshTokenSubject,
		},
		HttpServer: config.HttpServer{Port: 8088},
	}

	migrator := migrator.New(cfg.MyPostgres)
	if os.Getenv("ENV") != "production" {
		fmt.Println(migrator, "mii")
		migrator.Up()

	}

	fmt.Println("server is runing")

	authSvc, userSvc, learningSvc, shadowingSvc, progressSvc, settingsSvc, notificationSvc, submissionSvc, subscriptionSvc, topicSuggestionSvc, habitSvc, billingSvc, leitnerSvc, otpSvc := setupservice(cfg)

	go worker.RunNotificationScheduler(context.Background(), notificationSvc)

	server := httpserver.New(cfg, userSvc, authSvc, cfg.Auth, learningSvc, shadowingSvc, progressSvc, settingsSvc, notificationSvc, submissionSvc, subscriptionSvc, topicSuggestionSvc, habitSvc, billingSvc, leitnerSvc, otpSvc)

	server.Server()

}

func setupservice(cfg config.Config) (authservice.Service, userservice.Service,
	learningservice.Service, shadowingservice.Service, progressservice.Service, *settingsservice.Service,
	notificationservice.Service, submissionservice.Service, subscriptionservice.Service,
	topicsuggestionservice.Service, habitservice.Service, billingservice.Service, leitnerservice.Service,
	otpservice.Service) {

	authSvc := authservice.New(cfg.Auth)

	MyPostgresgresRepo := postgres.New(cfg.MyPostgres)

	UserRepo := postgresuser.New(MyPostgresgresRepo.DB)

	// ارسال کد تایید پیامکی برای فراموشی رمز/ثبت‌نام (sms.ir). اگر
	// SMS_IR_* ست نباشد، otp/send با خطا رد می‌شود ولی بقیه‌ی اپ سرپا
	// می‌ماند — مثل الگوی WHISPER_URL/CAFEBAZAAR.
	smsClient := smsservice.NewClient(
		getEnv("SMS_IR_API_KEY", ""),
		getEnv("SMS_IR_OTP_TEMPLATE_ID", ""),
	)
	if smsClient.Enabled() {
		fmt.Println("sms.ir otp: configured")
	} else {
		fmt.Println("sms.ir otp: SMS_IR_API_KEY/SMS_IR_OTP_TEMPLATE_ID not set, otp send disabled")
	}
	otpRepo := postgresotp.New(MyPostgresgresRepo.DB)
	otpSvc := otpservice.New(otpRepo, smsClient)

	userSvc := userservice.New(UserRepo, authSvc, otpSvc)

	learnningRepo := postgreslearning.New(MyPostgresgresRepo.DB)

	learnningSvc := learningservice.New(learnningRepo)

	sessionRepo := postgressession.New(MyPostgresgresRepo.DB)
	recordingRepo := postgresrecording.New(MyPostgresgresRepo.DB)

	// نمره‌دهی تلفظ از سایدکار تشخیص گفتار استفاده می‌کند. اگر WHISPER_URL
	// تنظیم نشده باشد یا سرویس بالا نباشد، ارزیاب خودش به نمره‌ی تخمینی
	// برمی‌گردد و ضبط کاربر با خطا رد نمی‌شود.
	var evaluator speecheval.Evaluator
	if whisperURL := getEnv("WHISPER_URL", ""); whisperURL != "" {
		evaluator = speecheval.NewWhisperEvaluator(whisperURL)
		fmt.Println("speech evaluation: whisper at", whisperURL)
	} else {
		evaluator = speecheval.NewHybridEvaluator()
		fmt.Println("speech evaluation: WHISPER_URL not set, scores will be estimates only")
	}

	streakRepo := postgressstreak.NewStreakRepository(MyPostgresgresRepo.DB)
	achievementRepo := postgresachievement.NewAchievementRepository(MyPostgresgresRepo.DB)
	sceneprogressRepo := postgresssceneprogress.NewSceneProgressRepository(MyPostgresgresRepo.DB)
	activityRepo := postgresactivity.New(MyPostgresgresRepo.DB)
	leitnerRepo := postgresleitner.New(MyPostgresgresRepo.DB)

	progressSvc := progressservice.New(streakRepo, achievementRepo, sceneprogressRepo, recordingRepo, leitnerRepo, activityRepo)

	leitnerSvc := leitnerservice.New(leitnerRepo)

	shadowingSvc := shadowingservice.New(sessionRepo, recordingRepo, learnningRepo, evaluator, progressSvc)

	settingsRepo := postgressettings.New(MyPostgresgresRepo.DB)
	settingsSvc := settingsservice.New(settingsRepo)
	if err := settingsSvc.LoadAll(context.Background()); err != nil {
		fmt.Println("warning: failed to load settings from db:", err)
	}

	notificationRepo := postgresnotification.New(MyPostgresgresRepo.DB)
	pushSvc := pushservice.New(settingsSvc)
	notificationSvc := notificationservice.New(notificationRepo, pushSvc)

	submissionRepo := postgressubmission.New(MyPostgresgresRepo.DB)
	submissionSvc := submissionservice.New(submissionRepo)

	subscriptionRepo := postgressubscription.New(MyPostgresgresRepo.DB)
	subscriptionSvc := subscriptionservice.New(subscriptionRepo)

	topicSuggestionRepo := posttopicsuggestion.New(MyPostgresgresRepo.DB)
	topicSuggestionSvc := topicsuggestionservice.New(topicSuggestionRepo)

	habitRepo := posthabit.New(MyPostgresgresRepo.DB)
	habitSvc := habitservice.New(habitRepo, progressSvc, getEnv("WHISPER_URL", ""))

	// پرداخت درون‌برنامه‌ای کافه‌بازار (Poolakey). اگر env های زیر پر نباشند،
	// billing service غیرفعال می‌ماند و verify-purchase با خطای مشخص رد
	// می‌شود — مثل الگوی WHISPER_URL، اپ سرپا می‌ماند بدون این قابلیت.
	cafebazaarClient := billingservice.NewCafeBazaarClient(
		getEnv("CAFEBAZAAR_PACKAGE_NAME", ""),
		getEnv("CAFEBAZAAR_CLIENT_ID", ""),
		getEnv("CAFEBAZAAR_CLIENT_SECRET", ""),
		getEnv("CAFEBAZAAR_REFRESH_TOKEN", ""),
	)
	billingSvc := billingservice.New(cafebazaarClient, subscriptionSvc)
	if billingSvc.Enabled() {
		fmt.Println("cafebazaar billing: configured")
	} else {
		fmt.Println("cafebazaar billing: CAFEBAZAAR_* env not set, purchase verification disabled")
	}

	// adminSvc := adminservice.New(UserRepo, ExerciseRepo, AssessmentRepo)

	return authSvc, userSvc, learnningSvc, *shadowingSvc, *progressSvc, settingsSvc, notificationSvc, submissionSvc, subscriptionSvc, topicSuggestionSvc, habitSvc, billingSvc, leitnerSvc, otpSvc
}
