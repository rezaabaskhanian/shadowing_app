package main

import (
	"bufio"
	"fmt"
	"os"
	"shadowing-backend/internal/config"
	"shadowing-backend/internal/delivery/httpserver"
	"strconv"
	"strings"

	"shadowing-backend/internal/pkg/filestore"
	"shadowing-backend/internal/repository/migrator"
	"shadowing-backend/internal/repository/postgres"

	postgresaiaccess "shadowing-backend/internal/repository/postgres/aiaccess"
	postgresaiconversation "shadowing-backend/internal/repository/postgres/aiconversation"
	postgresassessment "shadowing-backend/internal/repository/postgres/assessment"
	postgresfeedback "shadowing-backend/internal/repository/postgres/feedback"
	postgresfreespeech "shadowing-backend/internal/repository/postgres/freespeech"
	posthabit "shadowing-backend/internal/repository/postgres/habit"
	postgreslanding "shadowing-backend/internal/repository/postgres/landing"
	postgreslearning "shadowing-backend/internal/repository/postgres/learning"
	postgresleitner "shadowing-backend/internal/repository/postgres/leitner"
	postgresnotification "shadowing-backend/internal/repository/postgres/notification"
	postgresotp "shadowing-backend/internal/repository/postgres/otp"
	postgresachievement "shadowing-backend/internal/repository/postgres/progress/achievement"
	postgresactivity "shadowing-backend/internal/repository/postgres/progress/activity"
	postgresgrammar "shadowing-backend/internal/repository/postgres/progress/grammar"
	postgresssceneprogress "shadowing-backend/internal/repository/postgres/progress/scene_progress"
	postgressstreak "shadowing-backend/internal/repository/postgres/progress/streak"
	postgressettings "shadowing-backend/internal/repository/postgres/settings"
	postgresrecording "shadowing-backend/internal/repository/postgres/shadowing/recording"
	postgressession "shadowing-backend/internal/repository/postgres/shadowing/session"
	postgressubmission "shadowing-backend/internal/repository/postgres/submission"
	postgressubscription "shadowing-backend/internal/repository/postgres/subscription"
	postgretokentopup "shadowing-backend/internal/repository/postgres/tokentopup"
	posttopicsuggestion "shadowing-backend/internal/repository/postgres/topicsuggestion"
	postgresuser "shadowing-backend/internal/repository/postgres/user"

	// adminservice "shadowing-backend/internal/service/admin"

	"context"

	aiservice "shadowing-backend/internal/service/ai"
	aiaccessservice "shadowing-backend/internal/service/aiaccess"
	aiconversationservice "shadowing-backend/internal/service/aiconversation"
	assessmentservice "shadowing-backend/internal/service/assessment"
	authservice "shadowing-backend/internal/service/auth"
	billingservice "shadowing-backend/internal/service/billing"
	feedbackservice "shadowing-backend/internal/service/feedback"
	freespeechservice "shadowing-backend/internal/service/freespeech"
	habitservice "shadowing-backend/internal/service/habit"
	landingservice "shadowing-backend/internal/service/landing"
	learningservice "shadowing-backend/internal/service/learning"
	leitnerservice "shadowing-backend/internal/service/leitner"
	missionservice "shadowing-backend/internal/service/mission"
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
	tokentopupservice "shadowing-backend/internal/service/tokentopup"
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
			MaxConns: getEnvInt("DB_MAX_CONNS", 10),
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

	authSvc, userSvc, learningSvc, shadowingSvc, progressSvc, settingsSvc, notificationSvc, submissionSvc, subscriptionSvc, topicSuggestionSvc, feedbackSvc, habitSvc, billingSvc, leitnerSvc, otpSvc, landingSvc, assessmentSvc, missionSvc, aiConversationSvc, freeSpeechSvc, aiAccessSvc, tokenTopupSvc := setupservice(cfg)

	go runDailyStreakJob(context.Background(), progressSvc, notificationSvc)

	server := httpserver.New(cfg, userSvc, authSvc, cfg.Auth, learningSvc, shadowingSvc, progressSvc, settingsSvc, notificationSvc, submissionSvc, subscriptionSvc, topicSuggestionSvc, feedbackSvc, habitSvc, billingSvc, leitnerSvc, otpSvc, landingSvc, assessmentSvc, missionSvc, aiConversationSvc, freeSpeechSvc, aiAccessSvc, tokenTopupSvc)

	server.Server()

}

// streakJobHour ساعتی از شبانه‌روز (به وقت سرور) که کار روزانه‌ی استریک اجرا
// می‌شود — عصر، تا کاربری که هنوز امروز تمرین نکرده وقت داشته باشد پیش از
// نیمه‌شب یادآوری بگیرد و استریکش را نجات بدهد.
const streakJobHour = 20

// runDailyStreakJob هر روز یک‌بار اجرا می‌شود: اول استریک‌های قدیمی (که
// حداقل یک روز کامل بدون تمرین مانده‌اند) را می‌شکند، بعد به کاربرانی که
// امروز هنوز تمرین نکرده‌اند ولی استریکشان هنوز نشکسته پوش یادآوری می‌فرستد.
// خطاها فقط لاگ می‌شوند — یک اجرای ناموفق نباید سرور اصلی را متوقف کند و
// اجرای فردا خودش دوباره تلاش می‌کند.
func runDailyStreakJob(ctx context.Context, progressSvc progressservice.Service, notificationSvc notificationservice.Service) {
	for {
		time.Sleep(durationUntilNextHour(streakJobHour))

		broken, err := progressSvc.BreakStaleStreaks(ctx)
		if err != nil {
			fmt.Println("streak job: break stale streaks failed:", err)
		} else if broken > 0 {
			fmt.Println("streak job: broke", broken, "stale streak(s)")
		}

		sent, err := notificationSvc.SendStreakReminders(ctx)
		if err != nil {
			fmt.Println("streak job: send reminders failed:", err)
		} else if sent > 0 {
			fmt.Println("streak job: sent", sent, "streak reminder(s)")
		}

		vocabSent, err := notificationSvc.SendVocabReminders(ctx)
		if err != nil {
			fmt.Println("streak job: send vocab reminders failed:", err)
		} else if vocabSent > 0 {
			fmt.Println("streak job: sent", vocabSent, "vocab reminder(s)")
		}

		// گزارش هفتگی فقط دوشنبه‌ها اجرا می‌شود — همان روزِ شروعِ هفته که
		// TrendByUser هم بر همان اساس هفته‌ها را می‌شمارد (بخش ۲۱ سند
		// محصول)، تا وقتی می‌رسد هفته‌ی قبل واقعاً کامل شده باشد.
		if time.Now().Weekday() == time.Monday {
			digestSent, err := notificationSvc.SendWeeklyDigests(ctx)
			if err != nil {
				fmt.Println("streak job: send weekly digests failed:", err)
			} else if digestSent > 0 {
				fmt.Println("streak job: sent", digestSent, "weekly digest(s)")
			}
		}
	}
}

// durationUntilNextHour فاصله تا نزدیک‌ترین وقوع بعدی ساعت مشخص‌شده (به وقت
// محلی سرور) را برمی‌گرداند؛ اگر همین امروز نگذشته باشد امروز، وگرنه فردا.
func durationUntilNextHour(hour int) time.Duration {
	now := time.Now()
	next := time.Date(now.Year(), now.Month(), now.Day(), hour, 0, 0, 0, now.Location())
	if !next.After(now) {
		next = next.AddDate(0, 0, 1)
	}
	return next.Sub(now)
}

func setupservice(cfg config.Config) (authservice.Service, userservice.Service,
	learningservice.Service, shadowingservice.Service, progressservice.Service, *settingsservice.Service,
	notificationservice.Service, submissionservice.Service, subscriptionservice.Service,
	topicsuggestionservice.Service, feedbackservice.Service, habitservice.Service, billingservice.Service, leitnerservice.Service,
	otpservice.Service, landingservice.Service, *assessmentservice.Service, *missionservice.Service, *aiconversationservice.Service, *freespeechservice.Service, *aiaccessservice.Service, tokentopupservice.Service) {

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

	// همان مسیر آپلودی که httpserver با آن سرو می‌کند (internal/delivery/httpserver/server.go).
	const uploadDir = "uploads"
	const uploadURLPath = "/uploads"
	// store محلِ ذخیره‌ی فایل‌های عمومی/دائمی است — دیسکِ محلی مگر
	// OBJECT_STORAGE_* تنظیم شده باشد (نگاه کنید به filestore.New).
	store, err := filestore.New(uploadDir, uploadURLPath)
	if err != nil {
		fmt.Println("warning: object storage init failed:", err)
	}
	learnningSvc := learningservice.New(learnningRepo, getEnv("WHISPER_URL", ""), store)

	sessionRepo := postgressession.New(MyPostgresgresRepo.DB)
	recordingRepo := postgresrecording.New(MyPostgresgresRepo.DB)

	// نمره‌دهی تلفظ از سایدکار تشخیص گفتار استفاده می‌کند. اگر WHISPER_URL
	// تنظیم نشده باشد یا سرویس بالا نباشد، ارزیاب خودش به نمره‌ی تخمینی
	// برمی‌گردد و ضبط کاربر با خطا رد نمی‌شود.
	var evaluator speecheval.EvaluatorTranscriber
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
	grammarRepo := postgresgrammar.New(MyPostgresgresRepo.DB)

	progressSvc := progressservice.New(streakRepo, achievementRepo, sceneprogressRepo, recordingRepo, leitnerRepo, activityRepo, grammarRepo)

	leitnerSvc := leitnerservice.New(leitnerRepo)

	shadowingSvc := shadowingservice.New(sessionRepo, recordingRepo, learnningRepo, evaluator, progressSvc)

	settingsRepo := postgressettings.New(MyPostgresgresRepo.DB)
	settingsSvc := settingsservice.New(settingsRepo)
	if err := settingsSvc.LoadAll(context.Background()); err != nil {
		fmt.Println("warning: failed to load settings from db:", err)
	}

	// رونویسیِ خام (توضیح آزاد، گفتگو با AI، آیتم‌های گفتار آزادِ تست سطح) اگر
	// GROQ_API_KEY در پنل ادمین ست شده باشد روی Whisperِ Groq انجام می‌شود، وگرنه یا
	// اگر خطا داد، روی Whisperِ محلی. نمره‌دهی تلفظ همیشه محلی می‌ماند.
	if we, ok := evaluator.(*speecheval.WhisperEvaluator); ok {
		we.SetExternalTranscriber(speecheval.NewGroqClient(settingsSvc))
	}
	// وقتی چند instance از بک‌اند پشتِ لودبالانسر اجرا می‌شوند، تغییرِ تنظیمات
	// از پنل ادمین روی یک instance باید به بقیه هم برسد — این polling دوره‌ای
	// همان کار را می‌کند (نگاه کنید به settingsservice.Service.StartAutoRefresh).
	go settingsSvc.StartAutoRefresh(context.Background(), 0)

	notificationRepo := postgresnotification.New(MyPostgresgresRepo.DB)
	pushSvc := pushservice.New(settingsSvc)
	notificationSvc := notificationservice.New(notificationRepo, pushSvc, recordingRepo, leitnerRepo, grammarRepo)

	submissionRepo := postgressubmission.New(MyPostgresgresRepo.DB)
	submissionSvc := submissionservice.New(submissionRepo)

	subscriptionRepo := postgressubscription.New(MyPostgresgresRepo.DB)
	subscriptionSvc := subscriptionservice.New(subscriptionRepo)

	// دسترسی به فیچرهای گران (AI Conversation، Free Speech): اشتراکِ فعال
	// اجباری است + سقفِ محافظتیِ توکنِ روزانه‌ی مشترک برای همه (نگاه کنید به
	// internal/service/aiaccess). قبل از این، این دو فیچر بدون هیچ محدودیتی
	// در دسترسِ همه بودند.
	aiUsageRepo := postgresaiaccess.New(MyPostgresgresRepo.DB)
	aiAccessSvc := aiaccessservice.New(subscriptionSvc, aiUsageRepo, settingsSvc)

	topicSuggestionRepo := posttopicsuggestion.New(MyPostgresgresRepo.DB)
	topicSuggestionSvc := topicsuggestionservice.New(topicSuggestionRepo)

	feedbackRepo := postgresfeedback.New(MyPostgresgresRepo.DB)
	feedbackSvc := feedbackservice.New(feedbackRepo)

	habitRepo := posthabit.New(MyPostgresgresRepo.DB)
	habitSvc := habitservice.New(habitRepo, progressSvc, getEnv("WHISPER_URL", ""))

	landingRepo := postgreslanding.New(MyPostgresgresRepo.DB)
	landingSvc := landingservice.New(landingRepo)

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

	// خریدِ مصرفیِ توکن (تاپ‌آپ): همان کلاینتِ کافه‌بازاریِ بالا را دوباره
	// استفاده می‌کند (endpointِ اعتبارسنجیِ خریدِ تک‌باره برای هر دو یکی است)،
	// فقط گرنتش فرق دارد — به‌جای روزِ اشتراک، مستقیم اعتبار توکن اضافه می‌کند.
	tokenTopupRepo := postgretokentopup.New(MyPostgresgresRepo.DB)
	tokenTopupSvc := tokentopupservice.New(tokenTopupRepo, cafebazaarClient, aiAccessSvc)

	assessmentItemRepo := postgresassessment.NewItemRepository(MyPostgresgresRepo.DB)
	assessmentProfileRepo := postgresassessment.NewProfileRepository(MyPostgresgresRepo.DB)
	assessmentLogRepo := postgresassessment.NewSubmissionLogRepository(MyPostgresgresRepo.DB)
	assessmentSvc := assessmentservice.New(assessmentItemRepo, assessmentProfileRepo, assessmentLogRepo, evaluator, aiservice.New(settingsSvc))

	// «ماموریتِ امروز»: صحنه‌ی پیشنهادی بر اساسِ سطحِ گفتاری + مهارتِ ضعیف‌تر
	// کاربر. هیچ ریپازیتوریِ جدیدی نمی‌سازد، همان نمونه‌های بالا را دوباره
	// تزریق می‌کند (internal/service/mission).
	missionSvc := missionservice.New(learnningRepo, sceneprogressRepo, assessmentProfileRepo, recordingRepo, leitnerRepo, grammarRepo, notificationRepo)

	// گفتگوی آزاد بعد از تمام‌شدنِ یک صحنه: طبق تصمیمِ محصول، ElevenLabs فقط در
	// پنل ادمین (صدای دیالوگ‌های صحنه) استفاده می‌شود؛ اینجا دیگر TTS تزریق
	// نمی‌شود و پاسخ AI فقط به‌صورت متن برمی‌گردد.
	conversationRepo := postgresaiconversation.NewConversationRepository(MyPostgresgresRepo.DB)
	turnRepo := postgresaiconversation.NewTurnRepository(MyPostgresgresRepo.DB)
	hintRepo := postgresaiconversation.NewHintRepository(MyPostgresgresRepo.DB)
	aiConversationSvc := aiconversationservice.New(
		conversationRepo, turnRepo, hintRepo, assessmentProfileRepo, learnningRepo,
		aiservice.New(settingsSvc), evaluator,
		store, aiAccessSvc,
	)

	// Free Speech: یک بار توضیحِ آزاد بعد از تمام‌شدنِ یک صحنه، بدون AI-reply
	// و بدون مکالمه‌ی چندنوبتی — همان سه‌تایی transcribe/relevance/grammar که
	// در Assessment هم استفاده می‌شود، فقط از نقطه‌ی تمام‌شدنِ صحنه صدا زده می‌شود.
	freeSpeechLogRepo := postgresfreespeech.New(MyPostgresgresRepo.DB)
	freeSpeechSvc := freespeechservice.New(learnningRepo, freeSpeechLogRepo, aiservice.New(settingsSvc), evaluator, aiAccessSvc)

	// adminSvc := adminservice.New(UserRepo, ExerciseRepo, AssessmentRepo)

	return authSvc, userSvc, learnningSvc, *shadowingSvc, *progressSvc, settingsSvc, notificationSvc, submissionSvc, subscriptionSvc, topicSuggestionSvc, feedbackSvc, habitSvc, billingSvc, leitnerSvc, otpSvc, landingSvc, assessmentSvc, missionSvc, aiConversationSvc, freeSpeechSvc, aiAccessSvc, tokenTopupSvc
}
