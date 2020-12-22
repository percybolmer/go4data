# Web 

Web is a web application that can be used to control workflows.   
It consists of two parts  

The api part which is a GRPC api that can be used to control the workflow.  

The second part is the web ui which is also hosted.   

This i a Work in progress and not complete. 
There is alot of work that has to be done before this can be used in a good way. 

## Usage
The easiest way is to pull the repository, and then go inside /tooling/web and run "make install".  
This will create the required docker containers and start them up.


## Requirements before deploying
1. Change the JWT secret key in docker-compose.yaml
2. Change values in api/cert/certificate.config to match require host / domain