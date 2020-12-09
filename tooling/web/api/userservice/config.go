package userservice

import (
	"fmt"
	"log"
	"os"

	"github.com/jmoiron/sqlx"
	grpc "google.golang.org/grpc"
	"google.golang.org/grpc/credentials"

	_ "github.com/lib/pq"
)

// Config is used to control and generate the needs items in the api server
type Config struct {
	CertPemPath string
	KeyPath     string
	Host        string
	DbUser      string
	DbPassword  string
	DbName      string
	DbHost      string
	DbSecretKey string
	DbDevelMode string
	// SetupAPI is used to setup the api, its a function since we want different api stuff based on the Config, etc if cert is set or not
	SetupAPI func(cfg *Config) (*grpc.Server, error)
}

// LoadConfig us used to load certain environment variables that are needed for the project to run properly
func LoadConfig() *Config {
	pem := os.Getenv("CERTPEM")
	key := os.Getenv("KEY")
	host := os.Getenv("HOST")
	bcryptSecret := os.Getenv("BCRYPT_SECRET_KEY")
	psqldb := os.Getenv("POSTGRES_DB")
	psqluser := os.Getenv("POSTGRES_USER")
	psqlpass := os.Getenv("POSTGRES_PASSWORD")
	psqlhost := os.Getenv("POSTGRES_HOST")
	truncateDB := os.Getenv("POSTGRES_DROPDB")
	cfg := &Config{
		CertPemPath: pem,
		KeyPath:     key,
		Host:        host,
		DbUser:      psqluser,
		DbPassword:  psqlpass,
		DbName:      psqldb,
		DbHost:      psqlhost,
		DbSecretKey: bcryptSecret,
		DbDevelMode: truncateDB,
	}
	if pem == "" || key == "" {
		log.Println("CERTPEM and KEY was not set, using unsecure API. To secure api please set valid cert and key values")
		cfg.SetupAPI = SetupUnsecureGrpcAPI
	} else {
		cfg.SetupAPI = SetupTLSGrpcAPI
	}

	return cfg
}

// SetupTLSGrpcAPI is used to setup an API with TLS activated
func SetupTLSGrpcAPI(cfg *Config) (*grpc.Server, error) {
	cred, err := credentials.NewServerTLSFromFile(cfg.CertPemPath, cfg.KeyPath)
	if err != nil {
		return nil, err
	}

	s := grpc.NewServer(
		grpc.Creds(cred),
	)
	return s, nil

}

// SetupUnsecureGrpcAPI is used to run an unsecure api
func SetupUnsecureGrpcAPI(cfg *Config) (*grpc.Server, error) {
	s := grpc.NewServer()
	return s, nil
}

// SetupDatabase is used to trigger a new database connection to store API data
func SetupDatabase(cfg *Config) (*sqlx.DB, error) {
	uri := fmt.Sprintf("host=%s user=%s dbname=%s sslmode=disable password=%s", cfg.DbHost, cfg.DbUser, cfg.DbName, cfg.DbPassword)
	log.Println(uri)
	db, err := sqlx.Connect("postgres", uri)
	if err != nil {
		return nil, err
	}
	if cfg.DbDevelMode == "true" {

		db.MustExec(`DROP TABLE IF EXISTS users;`)
		// We need to init schema if not already done
		db.MustExec(schema)

		db.MustExec(`INSERT INTO users (email,name,password) VALUES ('tester@testersson.test', 'admin','');`)
	}

	return db, err

}
