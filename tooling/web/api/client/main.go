// This is only for testing purpose
package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
	"log"

	pb "github.com/percybolmer/workflow/tooling/web/api/userservice"
	"google.golang.org/grpc"
)

func main() {
	ctx := context.Background()
	conn, err := grpc.DialContext(ctx, "localhost:8000", grpc.WithInsecure())
	//conn, err := grpc.DialContext(ctx, "localhost:8000", grpc.WithTransportCredentials(credentials.NewTLS(loadTLSCfg())))
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()
	client := pb.NewUserClient(conn)
	resp, err := client.GetUser(ctx, &pb.UserRequest{Id: 1})
	if err != nil {
		log.Fatal(err)
	}
	log.Println(resp)
}

func loadTLSCfg() *tls.Config {
	b, _ := ioutil.ReadFile("../cert/ca.cert")
	cp := x509.NewCertPool()
	if !cp.AppendCertsFromPEM(b) {
		log.Fatal("credentials: failed to append certificates")
	}
	config := &tls.Config{
		InsecureSkipVerify: false,
		RootCAs:            cp,
	}
	return config
}
