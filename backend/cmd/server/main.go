package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/NicholasRucinski/commentasaurus/internal/routes"
	"github.com/joho/godotenv"
)

func main() {
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
