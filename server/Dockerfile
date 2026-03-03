FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY main.go ./
RUN go build -o /bin/milapin .

FROM alpine:3.20
RUN apk add --no-cache ffmpeg ca-certificates
COPY --from=build /bin/milapin /bin/milapin
WORKDIR /app
EXPOSE 8080
CMD ["milapin"]
