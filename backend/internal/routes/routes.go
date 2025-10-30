package routes

import (
	"net/http"

	comments "github.com/NicholasRucinski/commentasaurus/internal/comment"
	"github.com/rs/cors"
)

func RegisterRoutes() http.Handler {
	handler := &comments.Handler{}
	router := http.NewServeMux()

	router.HandleFunc("POST /comment", handler.Create)
	router.HandleFunc("GET /comment", handler.GetAll)
	router.HandleFunc("PATCH /comment", handler.Resolve)

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://commentasaurus.nickrucinski.com"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(router)

	return corsHandler
}
