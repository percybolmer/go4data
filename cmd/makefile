main: clean
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .
	sudo docker build . -t workflow:1.0
	sudo docker run --name workflow --network=host -v /development/mounts:/app/mounts:z workflow:1.0
	
clean:
	-sudo docker rmi -f workflow:1.0
	-sudo docker rmi $(sudo docker images | grep "^<none>" | awk "{print $3}")
	-sudo docker container rm -f workflow
	-sudo rm app