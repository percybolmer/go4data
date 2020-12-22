package userservice

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"os"
	"strings"
	"testing"

	"google.golang.org/grpc"

	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/test/bufconn"
)

var address = "0.0.0.0:8080"

const bufSize = 1024 * 1024

var lis *bufconn.Listener
var testserver *Server

func init() {
	lis = bufconn.Listen(bufSize)
	/* Set test Environments */
	os.Setenv("CERTPEM", "../cert/server.crt")
	os.Setenv("KEY", "../cert/server.key")
	os.Setenv("POSTGRES_DB", "workflow")
	os.Setenv("POSTGRES_USER", "user")
	os.Setenv("POSTGRES_HOST", "localhost")
	os.Setenv("POSTGRES_PASSWORD", "qwerty")
	os.Setenv("POSTGRES_DROPDB", "true")
	cfg := LoadConfig()

	db, err := SetupDatabase(cfg)
	if err != nil {
		log.Fatal("Failed to setup database", err)
	}
	server := NewServer(db, cfg)

	s, err := cfg.SetupAPI(cfg, server)
	if err != nil {
		log.Fatal(err)
	}
	err = server.PrepareStatements()
	if err != nil {
		log.Fatal(err)
	}
	testserver = server
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
	b, _ := ioutil.ReadFile("../cert/server.crt")
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
	// Spoof user to test

	_, err = client.CreateUser(ctx, &BaseRequest{Name: "admin", Password: "test", Email: "tester@testersson.test"})
	if err != nil && !strings.Contains(err.Error(), ErrUserAlreadyExists.Error()) {
		t.Fatal(err)
	}
	return client, conn
}
func TestGetUser(t *testing.T) {
	ctx := context.Background()

	_, err := testserver.GetUser(ctx, &UserRequest{Id: 0})
	if err != nil && !strings.Contains(err.Error(), ErrNoSuchUser.Error()) {
		t.Fatal(err)
	}

	// Spoof user to test

	_, err = testserver.CreateUser(ctx, &BaseRequest{Name: "admin", Password: "test", Email: "tester@testersson.test"})
	if err != nil && !strings.Contains(err.Error(), ErrUserAlreadyExists.Error()) {
		t.Fatal(err)
	}
	user, err := testserver.GetUser(ctx, &UserRequest{Id: 1})
	if err != nil {
		t.Fatal(err)
	}

	if user.Name != "admin" {
		t.Fatal("Got the wrong user")
	}

}

func TestCreateUser(t *testing.T) {
	ctx := context.Background()
	client, conn := newTestClient(t)
	defer conn.Close()

	_, err := client.CreateUser(ctx, &BaseRequest{Name: "admin", Email: "tester@testersson.test"})
	if err != nil && !strings.Contains(err.Error(), ErrUserAlreadyExists.Error()) {
		t.Fatal(err)
	}

	user, err := client.CreateUser(ctx, &BaseRequest{Name: "newuser", Email: "new@email.com", Password: "encryptme"})
	if err != nil {
		t.Fatal(err)
	}
	meta := metadata.New(nil)
	meta.Set("x-user-auth-token", user.Token)
	meta.Set("x-user-auth-id", fmt.Sprintf("%d", user.Id))
	ctx = metadata.NewOutgoingContext(ctx, meta)
	gotuser, err := client.GetUser(ctx, &UserRequest{Id: 2})
	if err != nil {
		t.Fatal(err)
	}

	if user.Name != gotuser.Name {
		t.Fatal("Got the wrong user")
	}
}

func TestLoginUser(t *testing.T) {
	ctx := context.Background()
	client, conn := newTestClient(t)
	defer conn.Close()

	_, err := client.Login(ctx, &BaseRequest{Name: "nosuchuser"})
	if err != nil && !strings.Contains(err.Error(), ErrNoSuchUser.Error()) {
		t.Fatal(err)
	}

	user, err := client.Login(ctx, &BaseRequest{Name: "admin", Password: "test"})
	if err != nil {
		t.Fatal(err)
	}

	user, err = client.Login(ctx, &BaseRequest{Name: "admin", Password: "wrong"})
	if err != nil {
		if !strings.Contains(err.Error(), ErrWrongPassword.Error()) {
			t.Fatal(err)
		}
	} else if user != nil {
		t.Fatal("User should be nil")
	}
}

func TestDeleteUser(t *testing.T) {
	ctx := context.Background()
	client, conn := newTestClient(t)
	defer conn.Close()

	_, err := client.DeleteUser(ctx, &UserRequest{Id: 1})
	if err != nil && !strings.Contains(err.Error(), "this route is protected, please login") {
		t.Fatal(err)
	}

	user, err := client.CreateUser(ctx, &BaseRequest{Name: "deleteme", Email: "delete@email.com", Password: "encryptme"})
	if err != nil {
		t.Fatal(err)
	}
	meta := metadata.New(nil)
	meta.Set("x-user-auth-token", user.Token)
	meta.Set("x-user-auth-id", fmt.Sprintf("%d", user.Id))
	ctx = metadata.NewOutgoingContext(ctx, meta)

	_, err = client.DeleteUser(ctx, &UserRequest{Id: user.Id})
	if err != nil {
		t.Fatal(err)
	}

	user, err = testserver.GetUser(ctx, &UserRequest{Id: user.Id})
	if !errors.Is(err, ErrNoSuchUser) {
		t.Fatal(err)
	}
}
