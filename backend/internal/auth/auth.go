package auth

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/NicholasRucinski/commentasaurus/internal/crypto"
	"github.com/NicholasRucinski/commentasaurus/internal/user"
	"github.com/golang-jwt/jwt/v5"
)

type Handler struct{}

func (h *Handler) StartAuth(w http.ResponseWriter, r *http.Request) {

	clientID := os.Getenv("OAUTH_ClIENT_ID")

	redirectBack := r.URL.Query().Get("redirect_uri")
	if redirectBack == "" {
		redirectBack = "http://localhost:3000"
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "redirect_after_login",
		Value:    url.QueryEscape(redirectBack),
		Path:     "/",
		HttpOnly: true,
	})

	scopes := "read:user user:email public_repo"

	redirectUrl := fmt.Sprintf("https://github.com/login/oauth/authorize?client_id=%s&scope=%s", clientID, scopes)

	http.Redirect(w, r, redirectUrl, http.StatusTemporaryRedirect)

}

func (h *Handler) AuthCallback(w http.ResponseWriter, r *http.Request) {

	encryptionKey := []byte(os.Getenv("COOKIE_KEY"))
	if len(encryptionKey) != 32 {
		log.Println("FATAL: COOKIE_ENCRYPTION_KEY is not 32 bytes")
		log.Println(len(encryptionKey))
		http.Error(w, "server configuration error", 500)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "missing code", http.StatusBadRequest)
		return
	}

	accessToken, err := getAccessToken(code)
	if err != nil {
		http.Error(w, err.Error(), 500)
	}

	userData, err := getUserData(accessToken)
	if err != nil {
		http.Error(w, err.Error(), 500)
	}

	claims := jwt.MapClaims{
		"user_id":    userData.ID,
		"name":       userData.Name,
		"email":      userData.Email,
		"avatar_url": userData.AvatarUrl,
		"orgs":       userData.OrgLogins,
		"exp":        time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString([]byte(os.Getenv("JWT_SECRET")))

	encryptedToken, err := crypto.Encrypt(encryptionKey, accessToken)
	if err != nil {
		http.Error(w, "failed to secure token", 500)
		return
	}

	isLocalHost := strings.Contains(r.Host, "localhost")

	sessionCookie := &http.Cookie{
		Name:     "session",
		Value:    signed,
		Path:     "/",
		HttpOnly: true,
		Expires:  time.Now().Add(24 * time.Hour),
	}

	githubCookie := &http.Cookie{
		Name:     "github_token",
		Value:    encryptedToken,
		Path:     "/",
		HttpOnly: true,
		Expires:  time.Now().Add(24 * time.Hour),
	}

	if !isLocalHost {
		sessionCookie.Domain = ".nickrucinski.com"
		sessionCookie.Secure = true
		sessionCookie.SameSite = http.SameSiteNoneMode

		githubCookie.Domain = ".nickrucinski.com"
		githubCookie.Secure = true
		githubCookie.SameSite = http.SameSiteNoneMode
	}

	http.SetCookie(w, sessionCookie)
	http.SetCookie(w, githubCookie)

	redirectAfter, err := r.Cookie("redirect_after_login")
	redirectURL := "http://localhost:3000"
	if err == nil {
		redirectURL, _ = url.QueryUnescape(redirectAfter.Value)
	}

	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session")
	if err != nil {
		log.Println(err)
		json.NewEncoder(w).Encode(map[string]any{
			"user": nil,
		})
		return
	}

	tokenStr := cookie.Value
	claims := jwt.MapClaims{}

	token, err := jwt.ParseWithClaims(tokenStr, &claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {

		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}

	user := user.User{
		ID:        int64(claims["user_id"].(float64)),
		Name:      claims["name"].(string),
		Email:     claims["email"].(string),
		AvatarUrl: claims["avatar_url"].(string),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"user": user,
	})
}

func getAccessToken(code string) (string, error) {

	clientID := os.Getenv("OAUTH_ClIENT_ID")
	secret := os.Getenv("OAUTH_SECRET")

	data := map[string]string{
		"client_id":     clientID,
		"client_secret": secret,
		"code":          code,
	}

	client := &http.Client{}

	b, _ := json.Marshal(data)
	req, err := http.NewRequest("POST", "https://github.com/login/oauth/access_token", bytes.NewBuffer(b))
	if err != nil {
		return "", err
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", errors.New("bad token response")
	}

	if tokenResp.AccessToken == "" {
		return "", errors.New("no access token received")
	}

	return tokenResp.AccessToken, nil
}

func getUserData(accessToken string) (*user.User, error) {
	client := &http.Client{}

	userReq, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	userReq.Header.Set("Authorization", "Bearer "+accessToken)

	userResp, err := client.Do(userReq)
	if err != nil {
		return nil, err
	}
	defer userResp.Body.Close()

	body, _ := io.ReadAll(userResp.Body)
	log.Println(string(body))
	var userData user.User
	json.Unmarshal(body, &userData)

	userReq, _ = http.NewRequest("GET", "https://api.github.com/user/orgs", nil)
	userReq.Header.Set("Authorization", "Bearer "+accessToken)
	orgsResp, err := client.Do(userReq)
	if err != nil {
		return nil, err
	}

	defer orgsResp.Body.Close()

	var orgs []struct {
		Login string `json:"login"`
	}
	json.NewDecoder(orgsResp.Body).Decode(&orgs)

	orgLogins := []string{}
	for _, org := range orgs {
		orgLogins = append(orgLogins, org.Login)
	}

	userData.OrgLogins = orgLogins

	return &userData, nil
}
