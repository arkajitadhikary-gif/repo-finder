<div align="center">

# 🔎 RepoFinder

**Describe what you want to build — instantly discover the best open-source repositories on GitHub.**

[![CI](https://github.com/<  arkajitadhikary-gif>/repo-finder/actions/workflows/ci.yml/badge.svg)](https://github.com/<  arkajitadhikary-gif>/repo-finder/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ What is this?

RepoFinder is a search engine for project ideas. Instead of typing exact keywords into
GitHub, you simply **describe the project you want to build** — even in casual language —

```
"ami ekta todo app banate chai react diye, dark mode soho"
"I want to build a Netflix clone with real-time streaming"
"expense tracker in python"
```

RepoFinder understands the plan, finds matching GitHub repositories, and shows them
**right on the page** — with stats, topics, a language breakdown, and the full rendered
README. No tab-switching needed.

## 🧠 How Smart Mode works

1. **Keyword extraction** — your description is normalized; filler words (English *and*
   romanized Bengali/Banglish) are stripped, and known phrases like "social media" are
   collapsed into search tokens.
2. **Vocabulary expansion** — domain synonyms are added (e.g. *todo → todo-app,
   task-manager, todo-list*; *ecommerce → shop, store, commerce*).
3. **Multi-query search** — broad match, curated `awesome-*` lists, and ready-made
   templates are searched in parallel via the GitHub Search API.
4. **Scoring & ranking** — every repo gets a 0–100 match score:

   | Signal | Weight |
   |---|---|
   | Popularity (log-scaled stars) | 45% |
   | Keyword relevance (name / description / topics) | 35% |
   | Maintenance recency (last push) | 20% |

**Simple Mode** is also available — it runs your exact words as a plain GitHub keyword
search, when you already know what you're looking for.

## 🖥 Features

- 🔍 **Smart & Simple search modes** — toggle between AI-style plan parsing and direct search
- 📇 **Rich result cards** — stars, forks, issues, topics, language, last-updated, match score
- 📖 **In-app repository viewer** — stats, language bar, topics and the full rendered README
- ⌨️ **Keyboard-first** — press `/` from anywhere to jump into the search box
- 🌑 **Premium dark UI** — glassmorphism, gradients, skeleton loaders, smooth animations
- 🚫 **No tracking, no accounts** — 100% client-facing, works straight out of the box

## 🚀 Getting started

**Requires Node.js 20+.**

```bash
git clone https://github.com/<arkajitadhikary-gif>/repo-finder.git
cd repo-finder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start searching.

### Production build

```bash
npm run build && npm start
```

### Optional: GitHub token (higher rate limits)

Without a token the app works out of the box (GitHub allows 10 searches/minute
unauthenticated). For personal or deployed use, create a token with **no extra scopes**
at [github.com/settings/tokens](https://github.com/settings/tokens) and add it to a
`.env.local` file:

```
GITHUB_TOKEN=ghp_your_token_here
```

This raises the limit to 30 searches/minute.

### Optional: point the "Open Source" button at your fork

The navbar links to `NEXT_PUBLIC_REPO_URL` (falls back to a placeholder).
Set it in `.env.local` once you've forked/published this:

```
NEXT_PUBLIC_REPO_URL=https://github.com/  arkajitadhikary-gif/your-fork
```

## 📁 Project structure

```
repo-finder/
├── app/
│   ├── api/search/route.ts      # POST endpoint: Simple + Smart search
│   ├── repo/[owner]/[repo]/     # In-app repository viewer (README, stats)
│   ├── page.tsx                  # Home — search UI, results grid
│   ├── layout.tsx                # Root layout & metadata
│   └── globals.css               # Theme, glassmorphism, markdown styles
├── components/
│   ├── RepoCard.tsx              # Result card
│   ├── Markdown.tsx              # README renderer (GFM, relative-image fix)
│   ├── CloneButton.tsx           # Copy `git clone` command
│   └── icons.tsx                 # Inline SVG icon set
├── lib/
│   ├── github.ts                 # GitHub REST API helpers
│   ├── smart-search.ts            # Keyword extraction, query building, ranking
│   └── format.ts                 # Formatting utilities
└── tailwind.config.ts
```

## 🤝 Contributing

Issues and pull requests are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for local
setup and the checks CI runs (`lint`, `typecheck`, `build`). Please also read the
[Code of Conduct](CODE_OF_CONDUCT.md). Found a security issue? See [SECURITY.md](SECURITY.md)
instead of opening a public issue.

## 📄 License

[MIT](LICENSE) © 2026 Arkajit Adhikary
