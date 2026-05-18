FROM golang:1.23-alpine AS build
WORKDIR /app

# install git for go modules
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/api ./

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
COPY --from=build /bin/api /usr/local/bin/api
COPY --from=build /app/openapi.yaml /openapi.yaml

EXPOSE 8080
ENV API_PORT=8080
CMD ["/usr/local/bin/api"]
