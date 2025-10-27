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

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(router)

	return corsHandler
}
