<div align="center">

# Commentasaurus

_Inline feedback, made simple_

[![Documentation](https://img.shields.io/badge/📚-Documentation-brightgreen)](https://commentasaurus.nickrucinski.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/NicholasRucinski/Commentasaurus/blob/main/LICENCE.md)
[![Made with Go](https://img.shields.io/badge/Backend-Go-00ADD8?logo=go)](https://go.dev/)
[![Made with Docusaurus](https://img.shields.io/badge/Frontend-Docusaurus-3E5EB1?logo=docusaurus)](https://docusaurus.io/)

</div>

---

## Abstract

**Commentasaurus** is a plugin for [Docusaurus](https://docusaurus.io/) that enables inline comments within your documentation pages, letting users give direct feedback on specific sections of text, similar to Google Docs.

---

## Tech Stack

| Layer        | Technologies                                     | Description                                                                     |
| ------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| **Frontend** | [Docusaurus](https://docusaurus.io/), TypeScript | Renders the documentation and plugin interface                                  |
| **Backend**  | [Go](https://go.dev/)                            | Handles comment APIs and authentication                                         |
| **Storage**  | GitHub Discussions                               | Comments are stored using GitHub Discussions for collaboration and transparency |

---

## Getting Started

### Folder Structure

```text
.
├── backend/
│   ├── main.go               # Golang API entrypoint
│   ├── routes/               # HTTP handlers and routing
│   └── ...
│
├── documentation/
│   ├── docs/                 # Markdown documentation about the plugin
│   ├── docusaurus.config.ts  # Docusaurus config (plugin settings live here)
│   └── plugins/
│       └── commentasaurus/   # Local path to test the plugin inside Docusaurus
│
└── plugin/
    └── src/                  # Source code of the plugin to be published to npm
```

> The /plugin directory should mirror the version under /documentation/plugins/commentasaurus to ensure consistency when testing.

## Running Locally

### Backend (Go API)

```bash
cd backend
go run ./cmd/server/main.go
```

By default, the API runs on http://localhost:8080

There is also a Dockerfile that can be used

### Documentation site

```bash
cd documentation
npm install
npm run start
```

This will open http://localhost:3000 for you.

## Environment Variables

DOCKER_TAG=<Where the docker image should be uploaded to>

GITHUB_TOKEN=<GitHub token required for allowing unauthenticated users>
OAUTH_ClIENT_ID=<Client ID of GitHub OAuth App>
OAUTH_SECRET=<Secret from GitHub OAuth App>
JWT_SECRET=<Random long string>
COOKIE_KEY=<32bit string for cookie encryption>

See the example Docusaurus config for setting up the plugin.

## Preview

TODO

## Contributing

I welcome contributions! Please open issues, submit pull requests, or reach out with suggestions.

1. Fork the repo
2. Create your branch (`git checkout -b feature/thing`)
3. Commit your changes (`git commit -am 'Add thing'`)
4. Push to the branch (`git push origin feature/thing`)
5. Open a pull request

## License

This project is licensed under the MIT License. See [LICENSE](https://github.com/NicholasRucinski/Commentasaurus/blob/main/LICENCE.md) for details.
While not required by the license, contributions back to this repository for any fixes or improvements are greatly appreciated.

## Collaborators

[//]: # " readme: collaborators -start "

<table>
    <tbody>
        <tr>
            <td align="center">
                <a href="https://github.com/NicholasRucinski">
                    <img src="https://avatars.githubusercontent.com/u/48574032?v=4" width="100;" alt="Nick"/>
                    <br />
                    <sub><b>Nick Rucinski</b></sub>
                </a>
            </td>
        </tr>
    </tbody>
</table>

[//]: # " readme: collaborators -end "
