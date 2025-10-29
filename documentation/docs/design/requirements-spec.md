---
sidebar_position: 3
---

# Requirements Specification

## Functional Requirements

- The system must allow feedback providers to submit feedback to students documentation pages within their hosted Docusaurus website.
- The system must allow users to authenticate using their GitHub accounts.
- The system must authorize users based on their GitHub team membership.
  - Admins of the GitHub organization are considered feedback providers.
  - Students who are members of the GitHub repository's team can also provide feedback.
  - Only feedback providers and members of the GitHub repository's team can view feedback comments.
  - Feedback from different teams should be allowed to facilitate student peer reviews.
- The system must allow authenticated users to create feedback comments on specific parts of a documentation page.
- The system must display feedback comments inline on the documentation pages.
- The system must ensure that feedback is only visible to the feedback provider and members of the GitHub repository's team.
- The system should allow users to reply to feedback comments.

## Non-Functional Requirements

- The system should provide a user-friendly interface for submitting and viewing feedback.
- The system should be low-cost or free to host and maintain.
- The system should ensure data security and privacy, restricting access to feedback based on GitHub team membership.
- The system should be scalable to accommodate multiple teams and feedback providers.
- The system should be a plugin or extension that can be easily integrated into existing Docusaurus sites and separately maintained.

## Figma Prototype

<a href="https://www.figma.com/proto/zHZW85y4nRNzZRcmg9xi51/Untitled?node-id=4-529&starting-point-node-id=4%3A528&t=7e7Lbsg5wVeiKtwj-1"><img width="1465" height="912" alt="Image" src="https://github.com/user-attachments/assets/3d7ca017-7390-49ef-8e97-42e95ad0197c" /></a>
