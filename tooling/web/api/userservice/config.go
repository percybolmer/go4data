package userservice

import (
	"fmt"
	"log"
	"os"

	"github.com/jmoiron/sqlx"
	grpc "google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

// Config is used to control and generate the needs items in the api server
type Config struct {
	CertPemPath  string
	KeyPath      string
	BackendHost  string
	DbUser       string
	DbPassword   string
	DbName       string
	DbHost       string
	DbDevelMode  string
	JWTSecretKey string
	SecureMode   bool
	// SetupAPI is used to setup the api, its a function since we want different api stuff based on the Config, etc if cert is set or not
	SetupAPI func(cfg *Config, server *Server) (*grpc.Server, error)
}

// LoadConfig us used to load certain environment variables that are needed for the project to run properly
func LoadConfig() *Config {
	pem := os.Getenv("CERTPEM")
	key := os.Getenv("KEY")
	backendHost := os.Getenv("BACKEND_HOST")
	JWTSecret := os.Getenv("JWT_SECRET_KEY")
	psqldb := os.Getenv("POSTGRES_DB")
	psqluser := os.Getenv("POSTGRES_USER")
	psqlpass := os.Getenv("POSTGRES_PASSWORD")
	psqlhost := os.Getenv("POSTGRES_HOST")
	truncateDB := os.Getenv("POSTGRES_DROPDB")
	cfg := &Config{
		CertPemPath:  pem,
		KeyPath:      key,
		BackendHost:  backendHost,
		DbUser:       psqluser,
		DbPassword:   psqlpass,
		DbName:       psqldb,
		DbHost:       psqlhost,
		DbDevelMode:  truncateDB,
		JWTSecretKey: JWTSecret,
	}
	if pem == "" || key == "" {
		log.Println("CERTPEM and KEY was not set, using unsecure API. To secure api please set valid cert and key values")
		cfg.SetupAPI = SetupUnsecureGrpcAPI
		cfg.SecureMode = false
	} else {
		cfg.SetupAPI = SetupTLSGrpcAPI
		cfg.SecureMode = true
	}

	return cfg
}

// SetupTLSGrpcAPI is used to setup an API with TLS activated
// will need a server object passed in since we need AuthMiddleware
func SetupTLSGrpcAPI(cfg *Config, server *Server) (*grpc.Server, error) {
	cred, err := credentials.NewServerTLSFromFile(cfg.CertPemPath, cfg.KeyPath)
	if err != nil {
		return nil, err
	}

	s := grpc.NewServer(
		grpc.Creds(cred),
		grpc.UnaryInterceptor(server.AuthMiddleware),
	)
	return s, nil

}

// SetupUnsecureGrpcAPI is used to run an unsecure api
func SetupUnsecureGrpcAPI(cfg *Config, server *Server) (*grpc.Server, error) {
	s := grpc.NewServer(
		grpc.UnaryInterceptor(server.AuthMiddleware),
	)
	return s, nil
}

// SetupDatabase is used to trigger a new database connection to store API data
func SetupDatabase(cfg *Config) (*sqlx.DB, error) {
	uri := fmt.Sprintf("host=%s user=%s dbname=%s sslmode=disable password=%s", cfg.DbHost, cfg.DbUser, cfg.DbName, cfg.DbPassword)
	db, err := sqlx.Connect("postgres", uri)
	if err != nil {
		return nil, err
	}

	return db, err

}
