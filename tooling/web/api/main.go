package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/improbable-eng/grpc-web/go/grpcweb"
	_ "github.com/lib/pq"
	"github.com/percybolmer/workflow/tooling/web/api/userservice"

	"google.golang.org/grpc"
)

func main() {
	cfg := userservice.LoadConfig()

	grpcserver := serveBackend(cfg)
	serveFrontend(grpcserver, cfg)

}

func serveFrontend(grpcserver *grpc.Server, cfg *userservice.Config) {
	hostOn := os.Getenv("FRONTEND_HOST")
	if hostOn == "" {
		log.Fatal("Need a FRONTEND_HOST env that specifies where to host frontend")
	}
	/* Ok, bried explanation to whats going on... GRPC requests will actually be multiplexed across http1,
	Ive choosen to use this way since I dont want to require Envoy to run in docker.
	So we will wrap our default HTTP server with a GRPC wrapper which we will then use a middleware
	To see if the requests are suppose to be forwarded to grpc api or the http api
	*/
	grpcWebServer := grpcweb.WrapServer(grpcserver)
	middleware := grpcwebMiddle{
		grpcWebServer,
	}
	r := http.NewServeMux()

	buildHandler := http.FileServer(http.Dir("/app/ui"))
	r.Handle("/", middleware.Handler(buildHandler))

	srv := &http.Server{
		Handler:      r,
		Addr:         hostOn,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	if cfg.SecureMode {
		fmt.Println("Serving Gui on https://", hostOn)
		log.Fatal(srv.ListenAndServeTLS(cfg.CertPemPath, cfg.KeyPath))
	} else {
		fmt.Println("Serving Gui on http://", hostOn)
		log.Fatal(srv.ListenAndServe())
	}

}

type grpcwebMiddle struct {
	*grpcweb.WrappedGrpcServer
}

// Handler is used to route requests to either grpc or to regular http
func (m *grpcwebMiddle) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if m.IsGrpcWebRequest(r) {
			m.ServeHTTP(w, r)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func serveBackend(cfg *userservice.Config) *grpc.Server {
	db, err := userservice.SetupDatabase(cfg)
	if err != nil {
		log.Fatal(err)
	}
	server := userservice.NewServer(db, cfg)
	s, err := cfg.SetupAPI(cfg, server)
	if err != nil {
		log.Fatal(err)
	}

	time.Sleep(2 * time.Second)

	err = server.PrepareStatements()
	if err != nil {
		log.Fatal(err)
	}
	userservice.RegisterUserServer(s, server)
	lis, err := net.Listen("tcp", cfg.BackendHost)
	if err != nil {
		log.Fatal(err)
	}
	go func() {
		log.Println("Serving the API at: ", cfg.BackendHost)
		if err := s.Serve(lis); err != nil {
			log.Fatalf("Error while serving: %v", err)
		}
	}()

	return s
}
