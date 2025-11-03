package routes

import (
	"net/http"

	"github.com/NicholasRucinski/commentasaurus/internal/auth"
	comments "github.com/NicholasRucinski/commentasaurus/internal/comment"
	"github.com/rs/cors"
)

func RegisterRoutes() http.Handler {
	commentHandler := &comments.Handler{}
	router := http.NewServeMux()

	router.HandleFunc("POST /{org}/{repo}/{page}/comments", commentHandler.Create)
	router.HandleFunc("GET /{org}/{repo}/{page}/comments", commentHandler.GetAll)
	router.HandleFunc("PATCH /{org}/{repo}/{page}/comments", commentHandler.Resolve)

	router.HandleFunc("POST /page/config", commentHandler.Config)

	authHandler := &auth.Handler{}

	router.HandleFunc("GET /auth", authHandler.StartAuth)
	router.HandleFunc("GET /auth/callback", authHandler.AuthCallback)
	router.HandleFunc("GET /me", authHandler.GetUser)

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://commentasaurus.nickrucinski.com"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(router)

	return corsHandler
}
