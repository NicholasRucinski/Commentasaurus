package comments

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/NicholasRucinski/commentasaurus/internal/crypto"
	"github.com/NicholasRucinski/commentasaurus/internal/utils"
)

type Handler struct{}

type AddCommentRequest struct {
	ID            string `json:"id"`
	ContextBefore string `json:"contextBefore"`
	Text          string `json:"text"`
	ContextAfter  string `json:"contextAfter"`
	Comment       string `json:"comment"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	log.Println("Received request to create a comment")

	encryptionKey := []byte(os.Getenv("COOKIE_KEY"))

	tokenCookie, err := r.Cookie("github_token")
	if err != nil {
		http.Error(w, "unauthorized: missing token", http.StatusUnauthorized)
		return
	}

	githubToken, err := crypto.Decrypt(encryptionKey, tokenCookie.Value)
	if err != nil {
		log.Printf("Failed to decrypt token: %v", err)
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}

	categoryId := r.URL.Query().Get("category_id")
	if categoryId == "" {
		http.Error(w, "Missing ?category_id= query parameter", http.StatusBadRequest)
		return
	}

	repoId := r.URL.Query().Get("repo_id")
	if repoId == "" {
		http.Error(w, "Missing ?repo_id= query parameter", http.StatusBadRequest)
		return
	}

	org := r.PathValue("org")
	repo := r.PathValue("repo")
	page := r.PathValue("page")

	var incoming AddCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&incoming); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	client := &http.Client{}

	discussionID, err := utils.FindOrCreateDiscussion(client, githubToken, org, repo, page, categoryId, repoId)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error finding/creating discussion: %v", err), http.StatusInternalServerError)
		return
	}

	commentId, err := utils.CreateComment(client, discussionID, githubToken, incoming.Comment, incoming.ContextBefore, incoming.Text, incoming.ContextAfter, page)
	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(commentId)

}

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	log.Println("Getting all comments")

	encryptionKey := []byte(os.Getenv("COOKIE_KEY"))

	permissionLevel := r.URL.Query().Get("permission_level")
	var githubToken string

	if permissionLevel != "anon" {
		tokenCookie, err := r.Cookie("github_token")
		if err != nil {
			log.Println(err)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode([]utils.Comment{})
			return
		}

		githubToken, err = crypto.Decrypt(encryptionKey, tokenCookie.Value)
		if err != nil {
			log.Printf("Failed to decrypt token: %v", err)
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

	} else {
		githubToken = os.Getenv("GITHUB_TOKEN")
	}

	categoryId := r.URL.Query().Get("category_id")
	if categoryId == "" {
		http.Error(w, "Missing ?category_id= query parameter", http.StatusBadRequest)
		return
	}

	repoId := r.URL.Query().Get("repo_id")
	if repoId == "" {
		http.Error(w, "Missing ?repo_id= query parameter", http.StatusBadRequest)
		return
	}

	org := r.PathValue("org")
	repo := r.PathValue("repo")
	page := r.PathValue("page")

	client := &http.Client{}

	discussionID, err := utils.FindOrCreateDiscussion(client, githubToken, org, repo, page, categoryId, repoId)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error finding/creating discussion: %v", err), http.StatusInternalServerError)
		return
	}

	comments, err := utils.GetComments(client, githubToken, discussionID, page)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

type ResolveCommentRequest struct {
	ID string `json:"id"`
}

func (h *Handler) Resolve(w http.ResponseWriter, r *http.Request) {
	log.Println("Resolving a comment")

	encryptionKey := []byte(os.Getenv("COOKIE_KEY"))

	tokenCookie, err := r.Cookie("github_token")
	if err != nil {
		http.Error(w, "unauthorized: missing token", http.StatusUnauthorized)
		return
	}

	githubToken, err := crypto.Decrypt(encryptionKey, tokenCookie.Value)
	if err != nil {
		log.Printf("Failed to decrypt token: %v", err)
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}

	page := r.PathValue("page")

	var req ResolveCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Invalid request body: ", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	client := &http.Client{}

	err = utils.UpdateComment(client, githubToken, req.ID, page)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"resolved"}`))
}
