FROM golang:1.23-alpine AS build
WORKDIR /app
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download
COPY . ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/parser ./parser

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
COPY --from=build /bin/parser /usr/local/bin/parser
EXPOSE 8081
CMD ["/usr/local/bin/parser"]
