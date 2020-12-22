FROM golang:latest


ARG backend_host
ARG frontend_host
ARG jwt_key

RUN mkdir /app

WORKDIR /app
COPY . .

# Generate certs and sign them
WORKDIR /app/cert/
RUN bash /app/cert/certgen.sh

WORKDIR /app

ENV POSTGRES_USER=user
ENV POSTGRES_PASSWORD=qwerty
ENV POSTGRES_DB=workflow
ENV POSTGRES_HOST=localhost
ENV POSTGRES_DROPDB=false
ENV CERTPEM="/app/cert/server.crt"
ENV KEY="/app/cert/server.key"
# The JWT_SECRET_KEY Should be changed to a secret key upon deployment to secure database values
ENV JWT_SECRET_KEY={jwt_key}
ENV BACKEND_HOST=${backend_host}
ENV FRONTEND_HOST=${frontend_host}
CMD ["/app/api"]
