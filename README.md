# 10x-cards

![version](https://img.shields.io/badge/version-0.0.1-blue)
![node](https://img.shields.io/badge/node-22.14.0-43853d)
![license](https://img.shields.io/badge/license-MIT-green)

AI-assisted flashcard creation and learning for faster study workflows.

## Project Description

10x-cards is a web application that helps users create and manage educational flashcards quickly. Users can paste a text passage (1,000 to 10,000 characters) and get AI-generated flashcard suggestions, then review, accept, edit, or reject them before saving. The app also supports manual flashcard creation, editing, and deletion, user accounts with authentication, and learning sessions powered by an external spaced-repetition algorithm. It tracks how many AI-generated flashcards are accepted, and aims to keep user data private and GDPR-compliant.

Additional documentation:
- [Product requirements (PRD)](.ai/prd.md)
- [Tech stack details](.ai/tech-stack.md)

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

- Frontend: Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/ui
- Backend: Supabase (PostgreSQL database, authentication)
- AI: OpenRouter.ai (LLM access)
- Tooling: ESLint, Prettier, Husky, lint-staged

## Getting Started Locally

Prerequisites:
- Node.js 22.14.0 (from `.nvmrc`)
- npm

Setup:
```bash
git clone git@github.com:Nefryt/10x-cards.git
cd 10x-cards
npm install
npm run dev
```

## Available Scripts

- `npm run dev` - Start the Astro development server
- `npm run build` - Build the production site
- `npm run preview` - Preview the production build locally
- `npm run astro` - Run the Astro CLI
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format files with Prettier

## Project Scope

In scope (MVP):
- AI-generated flashcards from pasted text
- Review flow to accept, edit, or reject generated flashcards
- Manual flashcard creation and a "My flashcards" list
- Edit and delete existing flashcards with confirmation
- User registration/login and access control per user
- Spaced-repetition learning session using an external algorithm
- Tracking how many AI suggestions are generated and accepted
- GDPR-compliant storage and right-to-delete support

Out of scope (MVP):
- Custom spaced-repetition algorithm
- Gamification
- Mobile applications
- Document imports (PDF, DOCX, etc.)
- Public API
- Sharing flashcards between users
- Advanced notification system
- Advanced keyword search

Success metrics:
- 75% of AI-generated flashcards are accepted by users
- At least 75% of newly added flashcards are AI-generated
- Track generated vs accepted counts for engagement analysis

## Project Status

Early development with MVP scope defined in the PRD. Current version: 0.0.1.

## License

MIT
