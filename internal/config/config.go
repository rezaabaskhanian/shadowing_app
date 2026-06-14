package config

import (
	"shadowing-backend/internal/repository/postgres"
	auth "shadowing-backend/internal/service/auth"
)

type HttpServer struct {
	Port int `koanf:"port"`
}

type Config struct {
	MyPostgres postgres.Config `koanf:"mypostgres"`
	Auth       auth.Config     `koanf:"auth"`
	HttpServer HttpServer      `koanf:"http_server"`
}
