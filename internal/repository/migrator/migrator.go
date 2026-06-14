package migrator

import (
	"fmt"
	"log"

	"database/sql"

	_ "github.com/jackc/pgx/v5/stdlib"

	"shadowing-backend/internal/repository/postgres"

	migrate "github.com/rubenv/sql-migrate"
)

type Migrator struct {
	dbconfig   postgres.Config
	migrations *migrate.FileMigrationSource
}

func New(dbConfig postgres.Config) Migrator {
	// OR: Read migrations from a folder:
	migrations := &migrate.FileMigrationSource{
		Dir: "../internal/repository/postgres/migrations",
	}
	return Migrator{
		dbconfig:   dbConfig,
		migrations: migrations,
	}
}

func (m Migrator) Up() {
	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		m.dbconfig.UserName,
		m.dbconfig.Password,
		m.dbconfig.Host,
		m.dbconfig.Port,
		m.dbconfig.DBName,
	)

	db, err := sql.Open("pgx", connStr)
	if err != nil {
		log.Fatal("cant open pgx:", err)
	}

	n, err := migrate.Exec(db, "postgres", m.migrations, migrate.Up)
	if err != nil {
		log.Fatal("cant apply migrations:", err)
	}

	fmt.Printf("Applied %d migrations!\n", n)
}

func (m Migrator) Down() {

	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		m.dbconfig.UserName,
		m.dbconfig.Password,
		m.dbconfig.Host,
		m.dbconfig.Port,
		m.dbconfig.DBName,
	)

	db, err := sql.Open("pgx", connStr)
	if err != nil {
		panic("can't applay migrations ")
	}

	n, err := migrate.Exec(db, "postgres", m.migrations, migrate.Down)
	if err != nil {
		// Handle errors!
		panic("can't rollback migrations ")
	}
	fmt.Printf("Applied %d migrations!\n", n)

}
func (m Migrator) Stats() {

}
