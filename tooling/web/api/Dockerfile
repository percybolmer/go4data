FROM golang:latest


ARG host


RUN mkdir /app

WORKDIR /app
COPY . .

# Generate certs and sign them
WORKDIR /app/cert/
#RUN bash /app/cert/certgen.sh

WORKDIR /app
# Commented out since I cant get Javascript client to work with TLS yet. Uncomment when Ready
#ENV CERTPEM="/app/cert/server.pem"
#ENV KEY="/app/cert/server.key"
ENV HOST=${host}

CMD ["/app/api"]
