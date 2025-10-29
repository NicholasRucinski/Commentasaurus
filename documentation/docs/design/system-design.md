---
sidebar_position: 4
---

# System Design

## Feedback Use Case Description

1. A feedback provider (teacher or TA) visits the Docusaurus documentation site.
2. The feedback provider clicks on a comments widget ("Sign in with GitHub" or similar) which leverages GitHub authentication and permissions.
3. The widget (client-side comments widget similar to giscus or utterances) creates or fetches a Discussion/Issue on GitHub that represents the page or an anchored comment thread.
4. The feedback provider navigates to a specific documentation page and selects a section to provide feedback on.
5. The feedback provider submits their feedback comment; the widget posts it as a GitHub Issue comment or Discussion reply.
6. The comment is rendered inline on the documentation page by the widget, and visibility is governed by the GitHub repository/discussion visibility (private repo/discussion) and team membership.
7. Students who are members of the GitHub repository's team can also view and reply to the feedback comments via the same widget (or directly in GitHub if preferred).

```mermaid
sequenceDiagram
    title Highlevel Sequence Diagram for Docusaurus Feedback System (GitHub Issues/Discussions backend)
    actor FeedbackProvider
    participant DocusaurusSite
    participant CommentsWidget as "Comments Widget (giscus/utterances-style)"
    participant GitHubOAuth
    participant GitHubAPI as "GitHub Issues/Discussions"
    actor Student

    FeedbackProvider->>DocusaurusSite: Visit documentation site
    DocusaurusSite-->>FeedbackProvider: Load page and comments widget
    FeedbackProvider->>CommentsWidget: Click "Sign in with GitHub"
    CommentsWidget->>GitHubOAuth: Initiate OAuth flow (widget or GitHub App)
    GitHubOAuth-->>FeedbackProvider: Redirect to GitHub for authentication
    FeedbackProvider->>GitHubOAuth: Provide GitHub credentials
    GitHubOAuth-->>CommentsWidget: Return token / grant
    CommentsWidget->>GitHubAPI: Verify user and repo/discussion access
    GitHubAPI-->>CommentsWidget: Return authorization and existing threads
    note right of DocusaurusSite: Feedback provider is now authenticated in the widget
    FeedbackProvider->>DocusaurusSite: Select section and submit feedback
    DocusaurusSite->>CommentsWidget: Post comment (Issue comment or Discussion reply)
    CommentsWidget->>GitHubAPI: Create comment (Issue/Discussion) with anchors/metadata
    GitHubAPI-->>CommentsWidget: Confirm comment created
    CommentsWidget-->>DocusaurusSite: Render comment inline
    Student->>DocusaurusSite: Visit documentation page
    DocusaurusSite-->>CommentsWidget: Fetch comments for page thread
    CommentsWidget->>GitHubAPI: Query Issue/Discussion comments
    GitHubAPI-->>CommentsWidget: Return comments (visible per repo/permission)
    DocusaurusSite-->>Student: Display documentation page with feedback
    Student->>DocusaurusSite: Reply to feedback comment
    DocusaurusSite->>CommentsWidget: Post reply
    CommentsWidget->>GitHubAPI: Store reply as Issue/Discussion comment
    GitHubAPI-->>CommentsWidget: Confirm reply stored
    CommentsWidget-->>DocusaurusSite: Display reply inline
```

## System Block Diagram

The goal is to avoid building and maintaining a separate server-backed application. Instead, we embed a client-side comments widget into the Docusaurus site. That widget interacts directly with GitHub Issues or Discussions (the "backend" in this design) for storage, authentication, and permissions.

Key points:

- Comments and replies are stored in GitHub Issues or Discussions. That means visibility and access are governed by the repository's visibility (private repo = repo members only) and GitHub teams.
- The embedded widget (open-source options exist: giscus, utteranc.es, or a custom widget) handles the OAuth handshake (or uses a GitHub App) and posts/fetches comments via the GitHub API.
- No dedicated application server is required for basic operation; the static site + widget + GitHub API handles the workflow.

```mermaid
block-beta
columns 1
    block columns 3
        OAUTH["GitHub OAuth / GitHub App"]
        space
        Docusaurus["Docusaurus Site (static)"]
        CommentsWidget["Embedded Comments Widget (giscus/utterances-style)"]
    end
    space
    block columns 3
        GitHub["GitHub Issues / Discussions"]
        left<["store comments\nand thread metadata"]>(left)
        GitHubAPI["GitHub API"]
    end

    Docusaurus --"embed widget"--> CommentsWidget
%%    CommentsWidget --"OAuth / API calls"--> OAUTH
    CommentsWidget --"create/fetch comments"--> GitHubAPI
```

If a small server-side component is required (for example, to manage a GitHub App private key, perform advanced access-control filtering, or mirror comments into another system), it should be intentionally minimal and serverless (GitHub Actions, Cloudflare Workers, or a tiny AWS Lambda) and only added if the GitHub-only approach cannot meet a concrete requirement. For most classroom uses, using private repositories or private discussion categories will provide the necessary access controls without introducing a full backend.
