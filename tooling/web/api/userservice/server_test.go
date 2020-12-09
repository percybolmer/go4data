package userservice

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
	"log"
	"net"
	"os"
	"strings"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/test/bufconn"
)

var address = "0.0.0.0:8080"

const bufSize = 1024 * 1024

var lis *bufconn.Listener
var mock sqlmock.Sqlmock

func init() {
	lis = bufconn.Listen(bufSize)
	/* Set test Environments */
	os.Setenv("CERTPEM", "../cert/server.pem")
	os.Setenv("KEY", "../cert/server.key")
	os.Setenv("POSTGRES_DB", "workflow")
	os.Setenv("POSTGRES_USER", "user")
	os.Setenv("POSTGRES_HOSTT", "localhost")
	os.Setenv("POSTGRES_PASSWORD", "qwerty")
	os.Setenv("POSTGRES_DROPDB", "true")
	cfg := LoadConfig()
	s, err := cfg.SetupAPI(cfg)
	if err != nil {
		log.Fatal(err)
	}
	db, err := SetupDatabase(cfg)
	if err != nil {
		log.Fatal("Failed to setup database", err)
	}
	server := NewServer(db, cfg)
	err = server.PrepareStatements()
	if err != nil {
		log.Fatal(err)
	}
	RegisterUserServer(s, server)
	go func() {
		if err := s.Serve(lis); err != nil {
			log.Fatalf("Server failed to setup: %v", err.Error())
		}
	}()
}

func bufDialer(context.Context, string) (net.Conn, error) {
	return lis.Dial()
}

func loadTLSCfg(t *testing.T) *tls.Config {
	b, _ := ioutil.ReadFile("../cert/ca.cert")
	cp := x509.NewCertPool()
	if !cp.AppendCertsFromPEM(b) {
		t.Fatal("credentials: failed to append certificates")
	}
	config := &tls.Config{
		InsecureSkipVerify: false,
		RootCAs:            cp,
	}
	return config
}

func newTestClient(t *testing.T) (UserClient, *grpc.ClientConn) {
	ctx := context.Background()
	cfg := loadTLSCfg(t)
	conn, err := grpc.DialContext(ctx, "localhost", grpc.WithContextDialer(bufDialer), grpc.WithTransportCredentials(credentials.NewTLS(cfg)))
	if err != nil {
		t.Fatal(err)
	}
	client := NewUserClient(conn)
	return client, conn
}
func TestGetUser(t *testing.T) {
	ctx := context.Background()
	client, conn := newTestClient(t)
	defer conn.Close()

	_, err := client.GetUser(ctx, &UserRequest{Id: 0})
	if err != nil && !strings.Contains(err.Error(), ErrNoSuchUser.Error()) {
		t.Fatal(err)
	}

}

func TestCreateUser(t *testing.T) {

}
