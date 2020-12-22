#!/usr/bin/make


main: clean gobuild run

install: clean gencert npmbuild gobuild  run

clean:
	@sudo docker-compose down
	
gencert:
	cd ./api/cert/ && bash certgen.sh

gobuild:
	cd ./api && go build -o api

npmbuild:
	rm -rf ./api/ui
	cd ./ui && npm install && npm run build
	mv ./ui/build ./api/ui

run: 
	sudo docker-compose up --build