package userservice

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
	"log"
	"net"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	sqlx "github.com/jmoiron/sqlx"
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

	s, err := SetupTLSGrpcAPI(&Config{
		CertPemPath: "../cert/server.pem",
		KeyPath:     "../cert/server.key",
	})
	if err != nil {
		log.Fatal(err)
	}
	mockDB, localmock, err := sqlmock.New()
	if err != nil {
		log.Fatal(err)
	}
	sqlx := sqlx.NewDb(mockDB, "postgres")
	server := NewServer(sqlx, nil)
	mock = localmock
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

	rows := sqlmock.NewRows([]string{"id", "name", "password", "email"}).AddRow(1, "test", "test", "test@test.com")
	mock.ExpectQuery("SELECT id,name,password,email FROM users ").WithArgs(1).WillReturnRows(rows)
	resp, err := client.GetUser(ctx, &UserRequest{Id: 1})
	if err != nil {
		t.Fatal(err)
	}
	log.Println(resp)
}
