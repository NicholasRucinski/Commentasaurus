package auth

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

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

	redirectUrl := fmt.Sprintf("https://github.com/login/oauth/authorize?client_id=%s&scope=read:user user:email", clientID)

	http.Redirect(w, r, redirectUrl, http.StatusTemporaryRedirect)

}

func (h *Handler) AuthCallback(w http.ResponseWriter, r *http.Request) {

	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "missing code", http.StatusBadRequest)
		return
	}
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
		http.Error(w, err.Error(), 500)
		return
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer resp.Body.Close()

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		http.Error(w, "bad token response", 500)
		return
	}

	if tokenResp.AccessToken == "" {
		http.Error(w, "no access token received", 400)
		return
	}

	userReq, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	userReq.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)

	userResp, err := client.Do(userReq)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer userResp.Body.Close()

	body, _ := io.ReadAll(userResp.Body)
	log.Println(string(body))
	var userData struct {
		ID        int64  `json:"id"`
		Login     string `json:"login"`
		Email     string `json:"email"`
		AvatarUrl string `json:"avatar_url"`
	}
	json.Unmarshal(body, &userData)

	claims := jwt.MapClaims{
		"user_id":    userData.ID,
		"name":       userData.Login,
		"email":      userData.Email,
		"avatar_url": userData.AvatarUrl,
		"exp":        time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString([]byte(os.Getenv("JWT_SECRET")))

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    signed,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(24 * time.Hour),
	})

	redirectAfter, err := r.Cookie("redirect_after_login")
	redirectURL := "http://localhost:3000"
	if err == nil {
		redirectURL, _ = url.QueryUnescape(redirectAfter.Value)
	}

	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}

type User struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	AvatarUrl string `json:"avatar_url"`
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session")
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
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

	user := User{
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
