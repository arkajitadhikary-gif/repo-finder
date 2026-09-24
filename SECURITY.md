# Security Policy

## Supported Versions

Only the latest commit on `main` is supported. This is a small, actively
developed project — there are no maintained release branches.

## Reporting a Vulnerability

If you find a security issue (for example, a way to leak a `GITHUB_TOKEN`,
an SSRF via the search/repo-detail routes, or a dependency vulnerability),
please **do not** open a public issue.

Instead, report it privately via GitHub's **"Report a vulnerability"**
button under this repo's **Security** tab (Security → Advisories → New
draft security advisory). If that's not available, contact the maintainer
directly through the email on their GitHub profile.

Please include:

- A description of the issue and its impact
- Steps to reproduce (a minimal example is ideal)
- Any suggested fix, if you have one

You should get an acknowledgement within a few days. There's no bug bounty
— this is a hobby/portfolio project — but reports are taken seriously and
credited in the fix commit/release notes unless you'd prefer otherwise.

## Dependency Vulnerabilities

This project runs `npm audit` as part of routine maintenance. If you notice
CI or `npm audit` flagging something we've missed, a PR bumping the affected
dependency (with `npm run build` passing) is very welcome.
