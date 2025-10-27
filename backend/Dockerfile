FROM golang:1.25

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLE=0 GOOS=linux go build -o /app/commentasaurus ./cmd/server/main.go

EXPOSE 8080

CMD ["/app/commentasaurus"]
