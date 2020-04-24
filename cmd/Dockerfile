FROM golang:alpine AS builder

#Use custom go path since using gomudles
RUN mkdir -p /app/workflow
RUN mkdir /app/mounts

WORKDIR /app/workflow

COPY . . 


FROM scratch

# Donwload Bash
#RUN apk add --no-cache bash
# Add bash default shell
#RUN apk add --no-cache shadow
#RUN chsh -s /bin/bash
WORKDIR /app/
COPY --from=builder /app/workflow .


#Configurations varibales
ENV WORKFLOW_PATH="/app/workflow.json"
ENV API_PORT=8080
CMD ["./app"]