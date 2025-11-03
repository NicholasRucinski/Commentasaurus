package comments

import (
	"errors"
	"fmt"
	"net/http"
)

type CommentPermission string

const (
	PermissionAnonymous CommentPermission = "anonymous"
	PermissionUserOnly  CommentPermission = "user"
	PermissionTeamOnly  CommentPermission = "team"
)

func (h *Handler) Config(w http.ResponseWriter, r *http.Request) {

}

func getPagePermission(r *http.Request) (CommentPermission, error) {
	pagePermissionStr := r.URL.Query().Get("page_permission")
	if pagePermissionStr == "" {
		return PermissionAnonymous, errors.New("page permision not in query params")
	}

	switch CommentPermission(pagePermissionStr) {
	case PermissionAnonymous, PermissionUserOnly, PermissionTeamOnly:
		return CommentPermission(pagePermissionStr), nil
	default:
		return PermissionAnonymous, fmt.Errorf("invalid comment permission: %s", pagePermissionStr)
	}
}
