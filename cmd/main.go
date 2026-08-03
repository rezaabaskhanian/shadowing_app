package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"shadowing-backend/internal/config"
	"shadowing-backend/internal/delivery/httpserver"

	"shadowing-backend/internal/repository/migrator"
	"shadowing-backend/internal/repository/postgres"

	postgreslearning "shadowing-backend/internal/repository/postgres/learning"
	postgresachievement "shadowing-backend/internal/repository/postgres/progress/achievement"
	postgresssceneprogress "shadowing-backend/internal/repository/postgres/progress/scene_progress"
	postgressstreak "shadowing-backend/internal/repository/postgres/progress/streak"
	postgresrecording "shadowing-backend/internal/repository/postgres/shadowing/recording"
	postgressession "shadowing-backend/internal/repository/postgres/shadowing/session"
	postgresuser "shadowing-backend/internal/repository/postgres/user"

	// adminservice "shadowing-backend/internal/service/admin"

	authservice "shadowing-backend/internal/service/auth"
	learningservice "shadowing-backend/internal/service/learning"
	progressservice "shadowing-backend/internal/service/progress"
	shadowingservice "shadowing-backend/internal/service/shadowing"

	userservice "shadowing-backend/internal/service/user"

	"time"
)

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
	JwtSignKey = "jwt_token"

	AccessTokenSubject  = "as"
	RefreshTokenSubject = "rs"

	AccessTokenExpirationDuration  = time.Hour * 24
	RefreshTokenExpirationDuration = time.Hour * 24 * 7
)

func main() {
	loadEnv(".env")

	cfg := config.Config{

		MyPostgres: postgres.Config{
			UserName: "reza_abasi",
			Password: "r1367R1367",
			Port:     5435,
			Host:     "localhost",
			DBName:   "shadowing-backend_db",
		},
		Auth: authservice.Config{
			SignKey:               JwtSignKey,
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

	authSvc, userSvc, learningSvc, shadowingSvc, progressSvc := setupservice(cfg)

	server := httpserver.New(cfg, userSvc, authSvc, cfg.Auth, learningSvc, shadowingSvc, progressSvc)

	server.Server()

}

func setupservice(cfg config.Config) (authservice.Service, userservice.Service,
	learningservice.Service, shadowingservice.Service, progressservice.Service) {

	authSvc := authservice.New(cfg.Auth)

	MyPostgresgresRepo := postgres.New(cfg.MyPostgres)

	UserRepo := postgresuser.New(MyPostgresgresRepo.DB)

	userSvc := userservice.New(UserRepo, authSvc)

	learnningRepo := postgreslearning.New(MyPostgresgresRepo.DB)

	learnningSvc := learningservice.New(learnningRepo)

	sessionRepo := postgressession.New(MyPostgresgresRepo.DB)
	recordingRepo := postgresrecording.New(MyPostgresgresRepo.DB)

	shadowingSvc := shadowingservice.New(sessionRepo, recordingRepo)

	streakRepo := postgressstreak.NewStreakRepository(MyPostgresgresRepo.DB)
	achievementRepo := postgresachievement.NewAchievementRepository(MyPostgresgresRepo.DB)
	sceneprogressRepo := postgresssceneprogress.NewSceneProgressRepository(MyPostgresgresRepo.DB)

	progressSvc := progressservice.New(streakRepo, achievementRepo, sceneprogressRepo)

	// adminSvc := adminservice.New(UserRepo, ExerciseRepo, AssessmentRepo)

	return authSvc, userSvc, learnningSvc, *shadowingSvc, *progressSvc
}
