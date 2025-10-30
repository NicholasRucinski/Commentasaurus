package main

import (
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/NicholasRucinski/commentasaurus/internal/routes"
	"github.com/joho/godotenv"
)

func main() {

	logsEnabled := flag.Bool("log", false, "Enable error logging")
	flag.Parse()

	if !*logsEnabled {
		log.SetOutput(io.Discard)
	}
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error loading it")
	}

	handler := routes.RegisterRoutes()

	server := http.Server{
		Addr:    ":8080",
		Handler: handler,
	}

	fmt.Println("Server listening on port :8080")
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
