<div align="center">

# 🔎 RepoFinder

**Describe what you want to build — AI breaks down the architecture, finds the best open-source repositories, and generates a step-by-step implementation roadmap.**

[![CI](https://github.com/arkajitadhikary-gif/repo-finder/actions/workflows/ci.yml/badge.svg)](https://github.com/arkajitadhikary-gif/repo-finder/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Groq AI](https://img.shields.io/badge/Groq-Llama%203.3-ff6b35?logo=data:image/svg+xml;base64,)](https://console.groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ What is this?

RepoFinder is an **AI-powered project architect and repository search engine**. Instead of typing exact keywords into GitHub, you simply **describe the project you want to build** — even in casual language:

```
"I want to build a real-time collaborative whiteboard"
"AI chatbot with RAG and vector search in Python"
"Full-stack e-commerce with Next.js, Stripe, and Supabase"
"ami ekta todo app banate chai react diye, dark mode soho"
```

RepoFinder uses **Groq Llama 3.3** to break your idea into architectural layers, finds the perfect open-source repositories for each tier, explains *why* each repo is relevant, and generates a full step-by-step implementation blueprint — all on one page.

---

## 🚀 Features

### 🤖 AI Architect Mode (Groq Llama 3.3)
- **Architecture Breakdown** — Your idea is decomposed into 2–4 distinct layers (Frontend, Backend, Database, Realtime, AI, Tools) with targeted repository searches per layer
- **"Why This Repo?" Insights** — Every result card shows a 1-sentence AI explanation of *why* that specific repository fits your project
- **Starter Blueprint & Roadmap Generator** — Click "Generate Starter Blueprint" to get a step-by-step implementation guide with sample code snippets, tech stack, key pitfalls, and recommended repos; export as Markdown

> All AI features degrade gracefully to smart heuristic fallbacks when `GROQ_API_KEY` is not set.

### ⚔️ Head-to-Head Repo Comparison
- Select 2–3 repositories with the **`+ Compare`** button on any card
- A floating dock appears at the bottom — click **"Compare Head-to-Head"** to open a side-by-side modal showing:
  - **Maintenance Health** — color-coded activity badge (Very Active / Active / Moderate / Stale)
  - **Star Velocity Bar** — visual proportional star count comparison
  - **License Compatibility** — Permissive (MIT, Apache) vs Copyleft (GPL) with color coding
  - **Forks, Open Issues, Last Commit, Primary Language**

### 🔍 In-App Code Explorer
- **Interactive File Tree** — Browse the entire repository file structure in-app, no GitHub tab switching required
- **Syntax-Highlighted Code Viewer** — 100+ languages via `highlight.js`, with line numbers and 1-click copy
- **File Search** — Filter files in real time inside the file tree panel
- Accessible via the **"In-App Code Explorer"** tab on every repository detail page

### ⚡ 1-Click Dev Environment Launch
On every repository detail page:
- **`github.dev`** — Open instantly in Web-based VS Code
- **`StackBlitz`** — Launch in a browser container (no install)
- **`▲ Deploy Vercel`** — 1-click Vercel deployment
- **`🚂 Deploy Railway`** — 1-click Railway deployment

### 🧠 Smart & Simple Search Modes
- **Smart Mode** — Keyword extraction (English + Banglish), vocabulary expansion, multi-angle parallel GitHub search, and 0–100 match scoring
- **Simple Mode** — Your exact words as a plain GitHub keyword search

### 💎 Premium UX
- 📇 Rich result cards — stars, forks, issues, topics, language, last-updated, match score
- ⌨️ Keyboard-first — press `/` from anywhere to jump into the search box
- 🌑 Glassmorphism dark UI with smooth animations and micro-interactions
- 🚫 No tracking, no accounts — works straight out of the box

---

## 🏗️ How AI Architect Mode Works

1. **Architecture Analysis** — Groq Llama 3.3 (or smart heuristics) decomposes your project into 2–4 architectural layers with category labels (`frontend`, `backend`, `database`, `realtime`, `ai`, `tools`)
2. **Layer-specific Search** — Targeted GitHub search queries are executed per layer in parallel
3. **"Why this repo?" Generation** — Groq evaluates each result against your project description and writes a concise relevance insight per repo
4. **Blueprint Generation** — On demand, Groq writes a full 3–4 step implementation roadmap with sample code, challenge notes, and recommended repo roles
5. **Heuristic Fallback** — All AI steps fall back to deterministic heuristics when the API key is absent or the API is unavailable

---

## 🧮 Smart Mode Ranking

| Signal | Weight |
|---|---|
| Popularity (log-scaled stars) | 45% |
| Keyword relevance (name / description / topics) | 35% |
| Maintenance recency (last push) | 20% |

---

## 🚀 Getting Started

**Requires Node.js 20+.**

```bash
git clone https://github.com/arkajitadhikary-gif/repo-finder.git
cd repo-finder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start building.

### Production Build

```bash
npm run build && npm start
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# Optional — raises GitHub Search rate limit from 10 → 30 req/min
# Create a free token with no extra scopes at https://github.com/settings/tokens
GITHUB_TOKEN=ghp_your_token_here

# Optional — enables Groq AI features (Architecture Breakdown, Insights, Blueprints)
# Get a free API key at https://console.groq.com/keys
GROQ_API_KEY=gsk_your_key_here
```

> **Without `GROQ_API_KEY`** the app works fully — all AI features degrade to smart heuristic fallbacks automatically.
>
> **`.env.local` is git-ignored** — your secrets are never committed.

---

## 📁 Project Structure

```
repo-finder/
├── app/
│   ├── api/
│   │   ├── search/route.ts       # POST: Smart + Simple search with AI architect analysis
│   │   ├── blueprint/route.ts    # POST: Generate starter blueprint via Groq
│   │   ├── repo-tree/route.ts    # GET:  GitHub repository file tree
│   │   └── repo-file/route.ts    # GET:  Raw file content for Code Explorer
│   ├── repo/[owner]/[repo]/
│   │   └── page.tsx              # Repository detail: stats, 1-click launch, tabs
│   ├── page.tsx                  # Home: search UI, architect layers, results grid
│   ├── layout.tsx                # Root layout & metadata
│   └── globals.css               # Theme, glassmorphism, markdown styles
├── components/
│   ├── RepoCard.tsx              # Result card with AI insight badge & Compare button
│   ├── RepoDetailTabs.tsx        # README / Code Explorer tab switcher
│   ├── CodeExplorer.tsx          # Interactive file tree + syntax highlighted viewer
│   ├── BlueprintModal.tsx        # Starter Blueprint & Roadmap modal
│   ├── RepoComparisonModal.tsx   # Head-to-Head repo comparison modal
│   ├── Markdown.tsx              # README renderer (GFM, relative-image fix)
│   ├── CloneButton.tsx           # Copy `git clone` command
│   └── icons.tsx                 # Inline SVG icon set
├── lib/
│   ├── architect.ts              # Groq AI integration + heuristic fallbacks
│   ├── github.ts                 # GitHub REST API helpers
│   ├── smart-search.ts           # Keyword extraction, query building, ranking
│   └── format.ts                 # Formatting utilities
└── tailwind.config.ts
```

---

## 🤝 Contributing

Issues and pull requests are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup and the checks CI runs (`lint`, `typecheck`, `build`). Please also read the [Code of Conduct](CODE_OF_CONDUCT.md). Found a security issue? See [SECURITY.md](SECURITY.md) instead of opening a public issue.

## 📄 License

[MIT](LICENSE) © 2026 Arkajit Adhikary
