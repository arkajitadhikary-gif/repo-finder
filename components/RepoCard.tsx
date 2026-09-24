import Link from "next/link";
import type { GitHubRepo } from "@/lib/github";
import { formatStars, languageColor, timeAgo } from "@/lib/format";
import { IconStar, IconFork, IconIssue } from "./icons";

export type RepoResult = GitHubRepo & { score?: number };

export default function RepoCard({ repo }: { repo: RepoResult }) {
  return (
    <Link
      href={`/repo/${repo.owner.login}/${repo.name}`}
      className="glass card-hover group flex flex-col rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={repo.owner.avatar_url}
          alt={`${repo.owner.login} avatar`}
          className="h-11 w-11 rounded-xl border border-white/10 object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-white transition group-hover:text-violet-300">
            {repo.owner.login}/<span className="text-white">{repo.name}</span>
          </h3>
          <p className="text-xs text-zinc-500">
            Updated {timeAgo(repo.pushed_at)}
          </p>
        </div>
        {typeof repo.score === "number" && (
          <span className="shrink-0 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-300">
            {repo.score}% match
          </span>
        )}
      </div>

      {/* Description */}
      <p className="mt-3 line-clamp-2 flex-none text-sm leading-6 text-zinc-400">
        {repo.description || "No description provided."}
      </p>

      {/* Topics */}
      {repo.topics && repo.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {repo.topics.slice(0, 4).map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-300/90"
            >
              {topic}
            </span>
          ))}
          {repo.topics.length > 4 && (
            <span className="text-[11px] text-zinc-500">
              +{repo.topics.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-zinc-400">
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: languageColor(repo.language) }}
            />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <IconStar className="h-3.5 w-3.5 text-amber-400" />
          {formatStars(repo.stargazers_count)}
        </span>
        <span className="flex items-center gap-1">
          <IconFork className="h-3.5 w-3.5" />
          {formatStars(repo.forks_count)}
        </span>
        <span className="flex items-center gap-1">
          <IconIssue className="h-3.5 w-3.5" />
          {formatStars(repo.open_issues_count)}
        </span>
      </div>
    </Link>
  );
}
