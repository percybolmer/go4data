#!/usr/bin/make

API_CONTAINER_NAME="workflow:devel"

main: clean buildproto gobuild run

run:
	sudo docker-compose up --build -d

clean:
	@sudo docker-compose down

gobuild:
	cd ./api && go build -o api

buildproto: 
	protoc proto/user.proto --js_out=import_style=commonjs,binary:./ui/src/ --grpc-web_out=import_style=commonjs,mode=grpcwebtext:./ui/src/ --go_out=plugins=grpc:./api/userservice/