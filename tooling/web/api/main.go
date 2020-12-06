package main

import (
	"log"
	"net"
	"time"

	_ "github.com/lib/pq"
	"github.com/percybolmer/workflow/tooling/web/api/userservice"
)

func main() {
	cfg := userservice.LoadConfig()

	s, err := cfg.SetupAPI(cfg)
	if err != nil {
		log.Fatal(err)
	}

	time.Sleep(2 * time.Second)
	db, err := userservice.SetupDatabase(cfg)
	if err != nil {
		log.Fatal(err)
	}

	userservice.RegisterUserServer(s, &userservice.Server{Db: db})
	lis, err := net.Listen("tcp", cfg.Host)
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Serving the API at: ", cfg.Host)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Error while serving: %v", err)
	}
}
