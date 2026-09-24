/**
 * Shared GitHub API helpers.
 *
 * Works out of the box with GitHub's unauthenticated rate limits
 * (60 req/min for core API, 10 req/min for search). To get higher
 * limits, set a GITHUB_TOKEN environment variable (fine-grained or
 * classic token with no extra scopes is enough for public data).
 */

const GH_API = "https://api.github.com";

export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string; avatar_url: string; html_url: string };
  html_url: string;
  description: string | null;
  topics?: string[];
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  license?: { spdx_id?: string; name?: string } | null;
  pushed_at: string;
  created_at: string;
  homepage?: string | null;
  archived?: boolean;
  default_branch?: string;
}

export function ghHeaders(accept = "application/vnd.github+json"): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    "User-Agent": "RepoFinder/1.0 (+https://github.com)",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Search GitHub repositories. Throws a readable Error on API failure. */
export async function searchRepositories(
  q: string,
  perPage = 20
): Promise<GitHubRepo[]> {
  const url =
    `${GH_API}/search/repositories?sort=stars&order=desc` +
    `&per_page=${perPage}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: ghHeaders(),
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    if (res.status === 403 || res.status === 429) {
      throw new Error(
        "GitHub API rate limit reached. Wait a minute and try again, or set a GITHUB_TOKEN for higher limits."
      );
    }
    throw new Error(body.message || `GitHub search failed (${res.status})`);
  }
  const data = (await res.json()) as { items?: GitHubRepo[] };
  return data.items ?? [];
}

/** Fetch a single repository. Returns null when it does not exist. */
export async function getRepo(owner: string, repo: string): Promise<GitHubRepo | null> {
  const res = await fetch(`${GH_API}/repos/${owner}/${repo}`, {
    headers: ghHeaders(),
    next: { revalidate: 300 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Could not load repository (${res.status})`);
  return (await res.json()) as GitHubRepo;
}

/** Fetch the raw README markdown, or null when the repo has none. */
export async function getReadme(owner: string, repo: string): Promise<string | null> {
  const res = await fetch(`${GH_API}/repos/${owner}/${repo}/readme`, {
    headers: ghHeaders("application/vnd.github.raw+json"),
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const text = await res.text();
  return text.length > 0 ? text : null;
}

/** Fetch the language breakdown (bytes per language). */
export async function getLanguages(
  owner: string,
  repo: string
): Promise<Record<string, number> | null> {
  const res = await fetch(`${GH_API}/repos/${owner}/${repo}/languages`, {
    headers: ghHeaders(),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return (await res.json()) as Record<string, number>;
}
