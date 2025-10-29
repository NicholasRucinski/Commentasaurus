---
sidebar_position: 2
---

# Background & Motivation

A common critique of using Docusaurus for classroom use, is the friction to providing feedback to documentation and writing. TA's and instructors often take screenshots of webpages and then send handwritten responses. Others want a more direct Google Docs like experience where inline text feedback could be provided. Although GitHub could be used this way, it's unintuitive and requires all feedback providers to recognize GitHub as a feedback mechanism. Having students submit Pull Requests for feedback is also unintuitive and may lead to stakeholders and team members without current documentation, or worse too many PRs.

We need some sort of way of keeping feedback in the hosted GitHub Pages deployment of Docusaurus, and a frictionless login mechanic where teams and feedback providers only need a GitHub account to leave and view feedback. Feedback should only be viewed by members of the team on GitHub, and the feedback provider. Inline text feedback would be a great first step, but future improvements could be allowing for handwritten feedback from iPad, and drawing tablet users. Part of what makes Docusaurus great to use in the classroom is its simplicity of being a static site. If we can avoid using a complicated or costly backend that should be high on the non-functional requirements list.

# Related Projects

- **Giscuss**: An open-source project that allows users to add comments and discussions to static websites by using GitHub Discussions as a backend. It provides a comments widget and maps pages to discussion threads.
- **Utterances**: A lightweight comments widget built on GitHub issues. It allows users to leave comments on static sites using their GitHub accounts.

Both of these projects provide a way to integrate GitHub for comments on static sites, which aligns with the requirements for this feedback system. They do not natively support per-team visibility filtering inside a public repo, so to meet the requirement that feedback be visible only to specific teams, we'll assume the classroom uses private repositories (or per-team private repos) or organization-only Discussions. If public pages are required but comments must remain private to teams, an optional small serverless proxy that verifies team membership and fetches comments on behalf of authenticated users could be added later.
