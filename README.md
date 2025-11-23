# 10x-cards

A modern web application that enables users to quickly create and manage educational flashcard sets. The application leverages LLM models (via API) to automatically generate flashcard suggestions from provided text, significantly reducing the time and effort required for creating high-quality study materials.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

10x-cards addresses the challenge of manual flashcard creation, which requires significant time and effort, discouraging users from utilizing the effective spaced repetition learning method. The solution aims to:

- **Automate flashcard generation**: Users can paste any text (e.g., textbook excerpts), and the application uses LLM models to generate flashcard suggestions (questions and answers)
- **Enable manual creation**: Users can manually create, edit, and delete flashcards
- **Provide secure access**: User authentication ensures that flashcards are private and accessible only to their creators
- **Integrate spaced repetition**: Flashcards are integrated with a spaced repetition algorithm for efficient learning sessions
- **Track statistics**: The application collects data on AI-generated flashcards and their acceptance rates

The application is designed with scalability, security, and GDPR compliance in mind, ensuring user data privacy and the right to access and delete personal information.

## Tech Stack

### Frontend
- **Astro 5** - Modern web framework for building fast, content-focused websites with minimal JavaScript
- **React 19** - UI library for building interactive components
- **TypeScript 5** - Static type checking for better code quality and IDE support
- **Tailwind CSS 4** - Utility-first CSS framework for styling
- **Shadcn/ui** - Accessible React component library

### Backend
- **Supabase** - Backend-as-a-Service solution providing:
  - PostgreSQL database
  - User authentication
  - Multi-language SDK
  - Open-source solution (can be self-hosted)

### AI Integration
- **OpenRouter.ai** - Service for accessing various LLM models (OpenAI, Anthropic, Google, and others) with:
  - Cost-effective model selection
  - API key financial limits

### DevOps
- **GitHub Actions** - CI/CD pipelines
- **DigitalOcean** - Application hosting via Docker

## Getting Started Locally

### Prerequisites

- **Node.js** v22.14.0 (as specified in `.nvmrc`)
- **npm** (comes with Node.js)
- **Supabase account** (for database and authentication)
- **OpenRouter.ai API key** (for AI flashcard generation)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/przeprogramowani/10x-astro-starter.git
cd 10x-astro-starter
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
   - Create a `.env` file in the root directory
   - Add your Supabase credentials (URL and anon key)
   - Add your OpenRouter.ai API key

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
   - Navigate to `http://localhost:4321` (or the port shown in the terminal)

### Building for Production

```bash
npm run build
npm run preview
```

## Available Scripts

- `npm run dev` - Start the development server with hot module replacement
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run astro` - Run Astro CLI commands
- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Automatically fix ESLint issues
- `npm run format` - Format code using Prettier

## Project Scope

### In Scope (MVP)

The following features are included in the Minimum Viable Product:

1. **Automatic flashcard generation**
   - Text input (1000-10,000 characters)
   - AI-powered flashcard suggestions via LLM API
   - Review, accept, edit, or reject generated flashcards

2. **Manual flashcard management**
   - Create flashcards manually (front and back)
   - Edit existing flashcards
   - Delete flashcards with confirmation

3. **User authentication**
   - User registration
   - User login
   - Account deletion with associated flashcards

4. **Spaced repetition integration**
   - Integration with an open-source spaced repetition algorithm
   - Learning session view with flashcard review
   - User feedback on flashcard mastery

5. **Statistics**
   - Track AI-generated flashcards
   - Monitor acceptance rates of generated flashcards

6. **Data privacy**
   - GDPR-compliant data storage
   - User right to access and delete data

### Out of Scope (MVP)

The following features are explicitly excluded from the MVP:

- Custom advanced spaced repetition algorithm (using existing open-source solution)
- Gamification mechanisms
- Mobile applications (web version only)
- Multi-format document import (PDF, DOCX, etc.)
- Public API
- Flashcard sharing between users
- Advanced notification system
- Advanced keyword search for flashcards

## Project Status

**Version:** 0.0.1

This project is currently in active development. The MVP is being built according to the Product Requirements Document (PRD).

### Success Metrics

The project aims to achieve:

- **75% acceptance rate**: 75% of AI-generated flashcards should be accepted by users
- **75% AI usage**: At least 75% of newly added flashcards should be created using AI
- **Engagement tracking**: Monitor generation and acceptance rates to analyze quality and usefulness

## License

MIT
