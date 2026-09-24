# Contributing to RepoFinder

Thanks for considering a contribution! This is a small project, so the process is deliberately lightweight.

## Getting set up

```bash
git clone https://github.com/<  arkajitadhikary-gif>/repo-finder.git
cd repo-finder
npm install
cp .env.example .env.local   # optional: add a GITHUB_TOKEN for higher rate limits
npm run dev
```

Before opening a PR, make sure these all pass:

```bash
npm run lint
npm run typecheck
npm run build
```

CI runs the same three checks on every push and pull request.

## Making changes

- Keep PRs focused — one feature or fix per PR is easier to review than a bundle of unrelated changes.
- Match the existing code style (TypeScript, functional components, Tailwind utility classes). There's no separate formatter config; `eslint-config-next` is the source of truth.
- If you're changing the Smart Mode ranking or keyword extraction (`lib/smart-search.ts`), include a couple of example queries in your PR description showing before/after results — it's easy to accidentally regress relevance for an unrelated query.
- UI changes should be checked at a mobile width as well as desktop; the layout uses Tailwind's responsive utilities throughout.

## Reporting bugs / requesting features

Open an issue using the templates under **New Issue**. For search-quality bugs ("X should have shown Y"), include the exact query you typed and which mode (Smart/Simple) you used — that's the fastest way to reproduce it.

## Security issues

Please don't open a public issue for security vulnerabilities — see [SECURITY.md](SECURITY.md) instead.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind.
