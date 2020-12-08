FROM node:latest as builder

ARG domain
RUN mkdir /app

WORKDIR /app

COPY package.json  /app
RUN npm install

COPY . /app


RUN npm run build


# Build further to use Nginx to host instead of npm
# Also ADD TLS from Certbot before production usage
FROM nginx:1.17.1-alpine
COPY --from=builder /app/build /usr/share/nginx/html

