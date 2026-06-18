package main

import (
	"fmt"
	"os"
	"shadowing-backend/internal/config"
	"shadowing-backend/internal/delivery/httpserver"

	"shadowing-backend/internal/repository/migrator"
	"shadowing-backend/internal/repository/postgres"

	postgreslearning "shadowing-backend/internal/repository/postgres/learning"
	postgresrecording "shadowing-backend/internal/repository/postgres/shadowing/recording"
	postgressession "shadowing-backend/internal/repository/postgres/shadowing/session"
	postgresuser "shadowing-backend/internal/repository/postgres/user"

	// adminservice "shadowing-backend/internal/service/admin"

	authservice "shadowing-backend/internal/service/auth"
	learningservice "shadowing-backend/internal/service/learning"
	shadowingservice "shadowing-backend/internal/service/shadowing"

	userservice "shadowing-backend/internal/service/user"

	"time"
)

const (
	JwtSignKey = "jwt_token"

	AccessTokenSubject  = "as"
	RefreshTokenSubject = "rs"

	AccessTokenExpirationDuration  = time.Hour * 24
	RefreshTokenExpirationDuration = time.Hour * 24 * 7
)

func main() {
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

	authSvc, userSvc, learningSvc, shadowingSvc := setupservice(cfg)

	server := httpserver.New(cfg, userSvc, authSvc, cfg.Auth, learningSvc, shadowingSvc)

	server.Server()

}

func setupservice(cfg config.Config) (authservice.Service, userservice.Service, learningservice.Service, shadowingservice.Service) {

	authSvc := authservice.New(cfg.Auth)

	MyPostgresgresRepo := postgres.New(cfg.MyPostgres)

	UserRepo := postgresuser.New(MyPostgresgresRepo.DB)

	userSvc := userservice.New(UserRepo, authSvc)

	learnningRepo := postgreslearning.New(MyPostgresgresRepo.DB)

	learnningSvc := learningservice.New(learnningRepo)

	sessionRepo := postgressession.New(MyPostgresgresRepo.DB)
	recordingRepo := postgresrecording.New(MyPostgresgresRepo.DB)

	shadowingSvc := shadowingservice.New(sessionRepo, recordingRepo)

	// adminSvc := adminservice.New(UserRepo, ExerciseRepo, AssessmentRepo)

	return authSvc, userSvc, learnningSvc, *shadowingSvc
}
