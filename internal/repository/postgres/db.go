package postgres

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Config struct {
	UserName string `koanf:"username"`
	Password string `koanf:"password"`
	Port     int    `koanf:"port"`
	Host     string `koanf:"host"`
	DBName   string `koanf:"db_name"`
	// MaxConns سقفِ تعداد اتصالِ هم‌زمانِ pool است. اگر صفر باشد، pgxpool
	// پیش‌فرضِ خودش (max(4, تعداد CPU)) را استفاده می‌کند که روی یک VPS
	// کم‌رم/کم‌هسته می‌تواند خیلی زود صف ایجاد کند وقتی چند درخواستِ گفتگوی
	// AI هم‌زمان به دیتابیس می‌خورند.
	MaxConns int `koanf:"max_conns"`
}

type DB struct {
	DB     *pgxpool.Pool
	config Config
}

func New(cfg Config) *DB {

	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		cfg.UserName,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.DBName,
	)
	if cfg.MaxConns > 0 {
		connStr += fmt.Sprintf("&pool_max_conns=%d", cfg.MaxConns)
	}

	db, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		log.Fatal("Unable to connect to database:", err)
	}
	return &DB{DB: db, config: cfg}

}
