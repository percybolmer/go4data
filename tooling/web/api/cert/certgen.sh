#!/bin/bash

#Generate RSA key
#openssl genrsa -out server.key 2048 

# Generate self signed x509 public key
#openssl req -new -x509 -sha256 -key server.key -out server.csr -days 3650 -config certificate.con

# generate ca.key 
openssl genrsa -out ca.key 4096
# generate certificate
openssl req -new -x509 -key ca.key -sha256 -subj "/C=SE/ST=HL/O=Workflow, INC." -days 365 -out ca.cert
# generate the server key
openssl genrsa -out server.key 4096
# Generate the csr
openssl req -new -key server.key -out server.csr -config certificate.conf
# 
openssl x509 -req -in server.csr -CA ca.cert -CAkey ca.key -CAcreateserial -out server.crt -days 365 -sha256 -extfile certificate.conf -extensions req_ext