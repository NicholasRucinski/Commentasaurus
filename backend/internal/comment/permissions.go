package comments

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/NicholasRucinski/commentasaurus/internal/user"
	"github.com/NicholasRucinski/commentasaurus/internal/utils"
)

type CommentPermission string

const (
	PermissionAnonymous CommentPermission = "anon"
	PermissionAuthOnly  CommentPermission = "auth"
	PermissionTeamOnly  CommentPermission = "team"
)

func (h *Handler) Setup(w http.ResponseWriter, r *http.Request) {

	githubToken := os.Getenv("GITHUB_TOKEN")
	if githubToken == "" {
		http.Error(w, "Missing GitHub config", http.StatusInternalServerError)
		return
	}

	categoryName := r.URL.Query().Get("category_name")
	if categoryName == "" {
		categoryName = "General"
	}

	org := r.PathValue("org")
	repo := r.PathValue("repo")

	client := &http.Client{}

	categoryId, err := utils.FindOrCreateCommentsCategory(client, githubToken, org, repo, categoryName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	repositoryId, err := utils.GetRepositoryID(client, githubToken, org, repo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ret := struct {
		CategoryId   string
		RepositoryId string
	}{
		CategoryId:   categoryId,
		RepositoryId: repositoryId,
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ret)
}

type GetPermissionsRequest struct {
	User            *user.User        `json:"user,omitempty"`
	PermissionLevel CommentPermission `json:"permission_level"`
}

func (h *Handler) Permissions(w http.ResponseWriter, r *http.Request) {
	org := r.PathValue("org")

	var body GetPermissionsRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	switch body.PermissionLevel {
	case PermissionAnonymous:
		w.WriteHeader(http.StatusOK)
	case PermissionAuthOnly:
		if body.User != nil {
			w.WriteHeader(http.StatusOK)
		} else {
			w.WriteHeader(http.StatusUnauthorized)
		}
	case PermissionTeamOnly:
		if body.User.IsInOrg([]string{org}) {
			w.WriteHeader(http.StatusOK)
		} else {
			w.WriteHeader(http.StatusUnauthorized)
		}
	}

}
