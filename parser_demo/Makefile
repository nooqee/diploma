.DEFAULT_GOAL := build 

.PHONY:fmt vet lint build 
		
fmt:
		go fmt ./...

vet: fmt
		go vet ./...

lint: vet
		golangci-lint run

build: lint
		go run main.go

clean:
	rm -f test