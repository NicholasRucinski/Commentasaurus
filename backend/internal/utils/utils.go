package utils

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
)

type Comment struct {
	ID            string `json:"id"`
	Page          string `json:"page"`
	BeforeContext string `json:"contextBefore"`
	Text          string `json:"text"`
	AfterContext  string `json:"contextAfter"`
	Comment       string `json:"comment"`
	User          string `json:"user,omitempty"`
	Resolved      bool   `json:"resolved"`
	CreatedAt     string `json:"createdAt"`
}

type GraphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables"`
}

func GetRepositoryID(client *http.Client, githubToken, owner, repo string) (string, error) {
	query := `
	query GetRepositoryID($owner: String!, $repo: String!) {
	  repository(owner: $owner, name: $repo) {
	    id
	  }
	}`

	reqBody := GraphQLRequest{
		Query: query,
		Variables: map[string]interface{}{
			"owner": owner,
			"repo":  repo,
		},
	}

	respBody, status, err := callGitHubGraphQL(client, githubToken, reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to call GitHub GraphQL API: %w", err)
	}
	if status != http.StatusOK {
		return "", fmt.Errorf("GitHub API returned status %d: %s", status, string(respBody))
	}

	var result struct {
		Data struct {
			Repository struct {
				ID string `json:"id"`
			} `json:"repository"`
		} `json:"data"`
	}

	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("failed to decode GitHub response: %w", err)
	}

	if result.Data.Repository.ID == "" {
		return "", fmt.Errorf("repository not found: %s/%s", owner, repo)
	}

	return result.Data.Repository.ID, nil
}

func GetComments(client *http.Client, githubToken, discussionID, page string) ([]Comment, error) {
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
		return nil, fmt.Errorf("Error fetching comments: %v", err)
	}
	if status != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned %d: %s", status, string(respBody))
	}

	// log.Printf("GitHub Response: %s\n", string(respBody))
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
						CreatedAt string `json:"createdAt"`
					} `json:"nodes"`
				} `json:"comments"`
			} `json:"node"`
		} `json:"data"`
	}

	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("Error decoding JSON: %v", err)
	}

	var comments []Comment
	for _, node := range result.Data.Node.Comments.Nodes {
		parsed := parseCommentBody(node.Body, page)
		resolved, err := strconv.ParseBool(parsed["resolved"])
		if err != nil {
			log.Println("Failed to parse resolved to bool")
			resolved = false
		}
		if !resolved {
			comments = append(comments, Comment{
				ID:            node.ID,
				Page:          page,
				BeforeContext: parsed["contextBefore"],
				Text:          parsed["text"],
				AfterContext:  parsed["contextAfter"],
				Comment:       parsed["comment"],
				User:          node.Author.Login,
				Resolved:      resolved,
				CreatedAt:     node.CreatedAt,
			})
		}
	}

	return comments, nil
}

func UpdateComment(client *http.Client, githubToken, id, page string) error {
	query := `
	query GetComment($id: ID!) {
	  node(id: $id) {
	    ... on DiscussionComment {
	      id
	      body
	    }
	  }
	}`

	getReq := GraphQLRequest{
		Query: query,
		Variables: map[string]interface{}{
			"id": id,
		},
	}

	respBody, status, err := callGitHubGraphQL(client, githubToken, getReq)
	if err != nil {
		log.Printf("Error fetching comment: %v", err)
		return fmt.Errorf("Error fetching comment: %v", err)
	}
	if status != http.StatusOK {
		log.Printf("GitHub API returned %d: %s", status, string(respBody))
		return fmt.Errorf("GitHub API returned %d: %s", status, string(respBody))
	}

	var result struct {
		Data struct {
			Node struct {
				ID   string `json:"id"`
				Body string `json:"body"`
			} `json:"node"`
		} `json:"data"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		log.Printf("Error decoding response: %v", err)
		return fmt.Errorf("Error decoding response: %v", err)
	}

	body := result.Data.Node.Body

	parsed := parseCommentBody(body, page)

	updatedBody := fmt.Sprintf(
		"%s\n\n```json\n%s\n```",
		parsed["comment"],
		toJSONString(map[string]string{
			"contextBefore": parsed["contextBefore"],
			"text":          parsed["text"],
			"contextAfter":  parsed["contextAfter"],
			"page":          parsed["page"],
			"resolved":      "true",
		}),
	)

	updateQuery := `
	mutation UpdateComment($id: ID!, $body: String!) {
	  updateDiscussionComment(input: { commentId: $id, body: $body }) {
	    comment {
	      id
	      body
	    }
	  }
	}`

	updateReq := GraphQLRequest{
		Query: updateQuery,
		Variables: map[string]interface{}{
			"id":   id,
			"body": updatedBody,
		},
	}

	updateResp, status, err := callGitHubGraphQL(client, githubToken, updateReq)
	if err != nil {
		log.Printf("Error updating comment: %v", err)
		return fmt.Errorf("Error updating comment: %v", err)
	}
	if status != http.StatusOK {
		log.Printf("GitHub API returned %d: %s", status, string(updateResp))
		return fmt.Errorf("GitHub API returned %d: %s", status, string(updateResp))
	}
	return nil
}

func FindOrCreateCommentsCategory(client *http.Client, token, owner, repo, categoryName string) (string, error) {
	query := `
	query GetDiscussionCategories($owner: String!, $repo: String!) {
	  repository(owner: $owner, name: $repo) {
	    discussionCategories(first: 20) {
	      nodes {
	        id
	        name
	      }
	    }
	  }
	}`

	reqBody := GraphQLRequest{
		Query: query,
		Variables: map[string]interface{}{
			"owner": owner,
			"repo":  repo,
		},
	}

	respBody, _, err := callGitHubGraphQL(client, token, reqBody)
	if err != nil {
		return "", fmt.Errorf("error fetching categories: %w", err)
	}

	var result struct {
		Data struct {
			Repository struct {
				DiscussionCategories struct {
					Nodes []struct {
						ID   string `json:"id"`
						Name string `json:"name"`
					} `json:"nodes"`
				} `json:"discussionCategories"`
			} `json:"repository"`
		} `json:"data"`
	}

	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("error decoding categories: %w", err)
	}

	for _, cat := range result.Data.Repository.DiscussionCategories.Nodes {
		if cat.Name == categoryName {
			log.Printf("Found existing discussion category '%s': %s", categoryName, cat.ID)
			return cat.ID, nil
		}
	}

	return "", fmt.Errorf("category %s not found (must be created manually)", categoryName)
}

func FindOrCreateDiscussion(client *http.Client, token, owner, repo, page, categoryId, repoId string) (string, error) {
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

	createReq := GraphQLRequest{
		Query: createQuery,
		Variables: map[string]interface{}{
			"repoId":     repoId,
			"title":      fmt.Sprintf("Page: %s", page),
			"body":       fmt.Sprintf("Discussion for comments on %s", page),
			"categoryId": categoryId,
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

func CreateComment(client *http.Client, discussionID, githubToken, comment, contextBefore, text, contextAfter, page string) (string, error) {
	commentBody := fmt.Sprintf(
		"%s\n\n```json\n%s\n```",
		comment,
		toJSONString(map[string]string{
			"contextBefore": contextBefore,
			"text":          text,
			"contextAfter":  contextAfter,
			"page":          page,
			"resolved":      "false",
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
		return "", fmt.Errorf(fmt.Sprintf("Error adding comment: %v", err))
	}

	if status != http.StatusOK {
		return "", fmt.Errorf(fmt.Sprintf("GitHub API returned %d: %s", status, string(respBody)))
	}

	var result struct {
		Data struct {
			AddDiscussionComment struct {
				Comment struct {
					ID string `json:"id"`
				} `json:"comment"`
			} `json:"addDiscussionComment"`
		} `json:"data"`
	}

	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", errors.New(fmt.Sprintf("Error decoding JSON: %v", err))
	}

	return result.Data.AddDiscussionComment.Comment.ID, nil
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
