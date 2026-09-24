import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepo, getReadme, getLanguages } from "@/lib/github";
import { formatStars, timeAgo, languageColor } from "@/lib/format";
import Markdown from "@/components/Markdown";
import CloneButton from "@/components/CloneButton";
import {
  IconArrowLeft,
  IconExternal,
  IconStar,
  IconFork,
  IconIssue,
} from "@/components/icons";

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner, repo: repoName } = await params;
  const repo = await getRepo(owner, repoName).catch(() => null);
  if (!repo) return { title: "Repository not found" };
  return {
    title: `${repo.full_name} on GitHub`,
    description: repo.description ?? undefined,
  };
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-xl px-4 py-3">
      <span className="text-violet-400">{icon}</span>
      <div>
        <p className="text-base font-bold leading-none text-white">{value}</p>
        <p className="mt-1 text-[11px] uppercase tracking-wider text-zinc-500">
          {label}
        </p>
      </div>
    </div>
  );
}

export default async function RepoPage({ params }: PageProps) {
  const { owner, repo: repoName } = await params;
  const [repo, readme, languages] = await Promise.all([
    getRepo(owner, repoName),
    getReadme(owner, repoName),
    getLanguages(owner, repoName),
  ]);

  if (!repo) notFound();

  const branch = repo.default_branch ?? "main";
  const licenseLabel = repo.license
    ? repo.license.spdx_id && repo.license.spdx_id !== "NOASSERTION"
      ? repo.license.spdx_id
      : "Custom"
    : "None";
  const langEntries = languages
    ? Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 6)
    : [];
  const totalBytes = langEntries.reduce((sum, [, n]) => sum + n, 0) || 1;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-violet-300"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to search
        </Link>

        {/* ---------- Header card ---------- */}
        <header className="glass animate-fade-up mt-6 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={repo.owner.avatar_url}
              alt={`${repo.owner.login} avatar`}
              className="h-16 w-16 rounded-2xl border border-white/10"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-400">
                <a
                  href={`https://github.com/${repo.owner.login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-violet-300"
                >
                  {repo.owner.login}
                </a>
              </p>
              <h1 className="mt-0.5 truncate text-2xl font-bold text-white sm:text-3xl">
                {repo.name}
              </h1>
              <p className="mt-2 text-[15px] leading-7 text-zinc-400">
                {repo.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Topics */}
          {repo.topics && repo.topics.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {repo.topics.slice(0, 10).map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90"
            >
              <IconExternal className="h-4 w-4" />
              View on GitHub
            </a>
            <CloneButton url={repo.html_url} />
            {repo.homepage && (
              <a
                href={repo.homepage}
                target="_blank"
                rel="noreferrer"
                className="glass flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition hover:border-violet-500/40"
              >
                <IconExternal className="h-4 w-4 text-zinc-400" />
                Homepage
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={<IconStar className="h-4 w-4" />}
              label="Stars"
              value={formatStars(repo.stargazers_count)}
            />
            <Stat
              icon={<IconFork className="h-4 w-4" />}
              label="Forks"
              value={formatStars(repo.forks_count)}
            />
            <Stat
              icon={<IconIssue className="h-4 w-4" />}
              label="Open issues"
              value={formatStars(repo.open_issues_count)}
            />
            <Stat
              icon={<IconExternal className="h-4 w-4" />}
              label="License"
              value={licenseLabel}
            />
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            {repo.language ? `Written in ${repo.language} · ` : ""}
            Created {new Date(repo.created_at).toLocaleDateString()} · Last
            pushed {timeAgo(repo.pushed_at)}
          </p>
        </header>

        {/* ---------- Language bar ---------- */}
        {langEntries.length > 0 && (
          <section className="mt-6">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-white/5">
              {langEntries.map(([lang, bytes]) => (
                <div
                  key={lang}
                  title={`${lang} — ${((bytes / totalBytes) * 100).toFixed(1)}%`}
                  style={{
                    width: `${(bytes / totalBytes) * 100}%`,
                    backgroundColor: languageColor(lang),
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {langEntries.map(([lang, bytes]) => (
                <span
                  key={lang}
                  className="flex items-center gap-1.5 text-xs text-zinc-400"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: languageColor(lang) }}
                  />
                  {lang}
                  <span className="text-zinc-600">
                    {((bytes / totalBytes) * 100).toFixed(1)}%
                  </span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ---------- README ---------- */}
        <section className="glass mt-8 rounded-3xl p-6 sm:p-10">
          <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-5">
            <svg
              className="h-5 w-5 text-violet-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            <h2 className="text-lg font-semibold text-white">README</h2>
          </div>
          {readme ? (
            <Markdown
              imageBase={`https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${branch}`}
            >
              {readme}
            </Markdown>
          ) : (
            <p className="text-sm text-zinc-500">
              This repository has no README file.
            </p>
          )}
        </section>

        <p className="mt-8 pb-8 text-center text-xs text-zinc-600">
          Rendered by RepoFinder from the GitHub REST API ·{" "}
          <a
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-violet-300"
          >
            {repo.full_name}
          </a>
        </p>
      </div>
    </div>
  );
}
