package comments

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

type Handler struct{}

// I think I want to send down repo name, id, and category id here
type AddCommentRequest struct {
	ID      string `json:"id"`
	Page    string `json:"page"`
	Text    string `json:"text"`
	Comment string `json:"comment"`
	Y       string `json:"y"`
}

type Comment struct {
	ID      string `json:"id"`
	Page    string `json:"page"`
	Text    string `json:"text"`
	Comment string `json:"comment"`
	Y       string `json:"y"`
	User    string `json:"user,omitempty"`
}

type GraphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	log.Println("Received request to create a comment")

	githubToken := os.Getenv("GITHUB_TOKEN")
	if githubToken == "" {
		http.Error(w, "GITHUB_TOKEN not set", http.StatusInternalServerError)
		return
	}

	repoOwner := os.Getenv("GITHUB_REPO_OWNER")
	repoName := os.Getenv("GITHUB_REPO_NAME")
	if repoOwner == "" || repoName == "" {
		http.Error(w, "Missing repo owner or name", http.StatusInternalServerError)
		return
	}

	var incoming AddCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&incoming); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	client := &http.Client{}

	discussionID, err := findOrCreateDiscussion(client, githubToken, repoOwner, repoName, incoming.Page)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error finding/creating discussion: %v", err), http.StatusInternalServerError)
		return
	}

	commentBody := fmt.Sprintf(
		"%s\n\n```json\n%s\n```",
		incoming.Comment,
		toJSONString(map[string]string{
			"text": incoming.Text,
			"y":    incoming.Y,
			"page": incoming.Page,
		}),
	)

	graphQLQuery := `
mutation AddDiscussionComment($discussionId: ID!, $body: String!) {
  addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
    comment { id body }
  }
}`

	reqBody := GraphQLRequest{
		Query: graphQLQuery,
		Variables: map[string]interface{}{
			"discussionId": discussionID,
			"body":         commentBody,
		},
	}

	respBody, status, err := callGitHubGraphQL(client, githubToken, reqBody)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error adding comment: %v", err), http.StatusInternalServerError)
		return
	}

	if status != http.StatusOK {
		http.Error(w, fmt.Sprintf("GitHub API returned %d: %s", status, string(respBody)), status)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Comment created!"))
}

func findOrCreateDiscussion(client *http.Client, token, owner, repo, page string) (string, error) {
	log.Printf("Looking for discussion for page: %s", page)

	findQuery := `
query FindDiscussion($query: String!) {
  search(query: $query, type: DISCUSSION, first: 5) {
    nodes {
      ... on Discussion {
        id
        title
      }
    }
  }
}`

	searchQuery := fmt.Sprintf("repo:%s/%s in:title \"Page: %s\"", owner, repo, page)

	findReq := GraphQLRequest{
		Query: findQuery,
		Variables: map[string]interface{}{
			"query": searchQuery,
		},
	}

	respBody, _, err := callGitHubGraphQL(client, token, findReq)
	if err != nil {
		return "", fmt.Errorf("error searching discussion: %w", err)
	}

	var findResult struct {
		Data struct {
			Search struct {
				Nodes []struct {
					ID    string `json:"id"`
					Title string `json:"title"`
				} `json:"nodes"`
			} `json:"search"`
		} `json:"data"`
	}

	if err := json.Unmarshal(respBody, &findResult); err != nil {
		return "", fmt.Errorf("error unmarshalling find result: %w", err)
	}

	for _, node := range findResult.Data.Search.Nodes {
		if node.Title == fmt.Sprintf("Page: %s", page) {
			log.Printf("Found existing discussion for %s: %s", page, node.ID)
			return node.ID, nil
		}
	}

	log.Printf("No existing discussion found for %s — creating new one", page)

	createQuery := `
mutation CreateDiscussion($repoId: ID!, $title: String!, $body: String!, $categoryId: ID!) {
  createDiscussion(input: {
    repositoryId: $repoId,
    title: $title,
    body: $body,
    categoryId: $categoryId
  }) {
    discussion { id title }
  }
}`

	repoID := os.Getenv("GITHUB_REPO_ID")
	categoryID := os.Getenv("GITHUB_CATEGORY_ID")

	createReq := GraphQLRequest{
		Query: createQuery,
		Variables: map[string]interface{}{
			"repoId":     repoID,
			"title":      fmt.Sprintf("Page: %s", page),
			"body":       fmt.Sprintf("Discussion for comments on %s", page),
			"categoryId": categoryID,
		},
	}

	createRespBody, _, err := callGitHubGraphQL(client, token, createReq)
	if err != nil {
		return "", fmt.Errorf("error creating discussion: %w", err)
	}

	var createResult struct {
		Data struct {
			CreateDiscussion struct {
				Discussion struct {
					ID    string `json:"id"`
					Title string `json:"title"`
				} `json:"discussion"`
			} `json:"createDiscussion"`
		} `json:"data"`
	}

	if err := json.Unmarshal(createRespBody, &createResult); err != nil {
		return "", fmt.Errorf("error unmarshalling create result: %w", err)
	}

	log.Printf("Created new discussion for %s: %s", page, createResult.Data.CreateDiscussion.Discussion.ID)
	return createResult.Data.CreateDiscussion.Discussion.ID, nil
}

func callGitHubGraphQL(client *http.Client, token string, body GraphQLRequest) ([]byte, int, error) {
	b, _ := json.Marshal(body)
	req, err := http.NewRequest("POST", "https://api.github.com/graphql", bytes.NewBuffer(b))
	if err != nil {
		return nil, 0, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("bearer %s", token))

	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	return respBody, resp.StatusCode, nil
}

func toJSONString(v interface{}) string {
	data, _ := json.MarshalIndent(v, "", "  ")
	return string(data)
}

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	page := r.URL.Query().Get("page")
	if page == "" {
		http.Error(w, "Missing ?page= query parameter", http.StatusBadRequest)
		return
	}

	githubToken := os.Getenv("GITHUB_TOKEN")
	repoOwner := os.Getenv("GITHUB_REPO_OWNER")
	repoName := os.Getenv("GITHUB_REPO_NAME")
	if githubToken == "" || repoOwner == "" || repoName == "" {
		http.Error(w, "Missing GitHub config", http.StatusInternalServerError)
		return
	}

	client := &http.Client{}

	discussionID, err := findOrCreateDiscussion(client, githubToken, repoOwner, repoName, page)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error finding/creating discussion: %v", err), http.StatusInternalServerError)
		return
	}

	query := `
query GetDiscussionComments($discussionId: ID!) {
  node(id: $discussionId) {
    ... on Discussion {
      comments(first: 50) {
        nodes {
          id
          body
          author {
            login
          }
          createdAt
        }
      }
    }
  }
}`

	reqBody := GraphQLRequest{
		Query: query,
		Variables: map[string]interface{}{
			"discussionId": discussionID,
		},
	}

	respBody, status, err := callGitHubGraphQL(client, githubToken, reqBody)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching comments: %v", err), http.StatusInternalServerError)
		return
	}
	if status != http.StatusOK {
		http.Error(w, fmt.Sprintf("GitHub API returned %d: %s", status, string(respBody)), status)
		return
	}

	log.Printf("GitHub Response: %s\n", string(respBody))
	var result struct {
		Data struct {
			Node struct {
				Comments struct {
					Nodes []struct {
						ID     string `json:"id"`
						Body   string `json:"body"`
						Author struct {
							Login string `json:"login"`
						} `json:"author"`
					} `json:"nodes"`
				} `json:"comments"`
			} `json:"node"`
		} `json:"data"`
	}

	if err := json.Unmarshal(respBody, &result); err != nil {
		http.Error(w, fmt.Sprintf("Error decoding JSON: %v", err), http.StatusInternalServerError)
		return
	}

	var comments []Comment
	for _, node := range result.Data.Node.Comments.Nodes {
		parsed := parseCommentBody(node.Body, page)
		comments = append(comments, Comment{
			ID:      node.ID,
			Page:    page,
			Text:    parsed["text"],
			Y:       parsed["y"],
			Comment: parsed["comment"],
			User:    node.Author.Login,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

func parseCommentBody(body, page string) map[string]string {
	out := map[string]string{"page": page, "comment": strings.TrimSpace(body)}

	startMarker := "```json"
	openIdx := strings.Index(body, startMarker)
	if openIdx == -1 {
		return out
	}

	afterOpen := body[openIdx+len(startMarker):]
	closeRelIdx := strings.Index(afterOpen, "```")
	if closeRelIdx == -1 {
		return out
	}

	jsonInner := strings.TrimSpace(afterOpen[:closeRelIdx])

	var meta map[string]string
	if err := json.Unmarshal([]byte(jsonInner), &meta); err != nil {
		log.Printf("parseCommentBody: failed to unmarshal json block: %v", err)
	} else {
		for k, v := range meta {
			out[k] = v
		}
	}

	out["comment"] = strings.TrimSpace(body[:openIdx])

	return out
}
