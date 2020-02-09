FROM golang:alpine AS builder

#Use custom go path since using gomudles
RUN mkdir -p /app/workflow
RUN mkdir /app/mounts

WORKDIR /app/workflow

COPY . . 


FROM scratch
WORKDIR /app/
COPY --from=builder /app/workflow .


#Configurations varibales
ENV WORKFLOW_PATH="/app/workflow.json"
CMD ["./app"]