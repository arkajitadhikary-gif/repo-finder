"use client";

import Link from "next/link";
import type { RepoResult } from "./RepoCard";
import { formatStars, languageColor, timeAgo } from "@/lib/format";
import { IconStar, IconFork, IconIssue, IconExternal } from "./icons";

interface RepoComparisonModalProps {
  repos: RepoResult[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveRepo: (repoId: number) => void;
}

function getHealthBadge(pushedAt: string) {
  const diffDays = Math.floor(
    (Date.now() - new Date(pushedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 30) {
    return { label: "Very Active", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
  }
  if (diffDays <= 90) {
    return { label: "Active", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
  }
  if (diffDays <= 365) {
    return { label: "Moderate", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
  }
  return { label: "Stale / Inactive", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" };
}

function getLicenseType(spdx?: string) {
  if (!spdx || spdx === "NOASSERTION") return { label: "None / Custom", type: "neutral" };
  const upper = spdx.toUpperCase();
  if (["MIT", "APACHE-2.0", "BSD-2-CLAUSE", "BSD-3-CLAUSE", "ISC"].includes(upper)) {
    return { label: `${spdx} (Permissive)`, type: "permissive" };
  }
  if (upper.includes("GPL") || upper.includes("AGPL")) {
    return { label: `${spdx} (Copyleft)`, type: "copyleft" };
  }
  return { label: spdx, type: "neutral" };
}

export default function RepoComparisonModal({
  repos,
  isOpen,
  onClose,
  onRemoveRepo,
}: RepoComparisonModalProps) {
  if (!isOpen) return null;

  const maxStars = Math.max(...repos.map((r) => r.stargazers_count), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-3xl border border-white/10 bg-base-950 p-6 shadow-2xl sm:p-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Head-to-Head Comparison</span>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                {repos.length} Repositories
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Compare activity, maintenance health, licensing, and community traction
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content Table / Columns */}
        <div className="flex-1 overflow-y-auto py-6">
          <div className={`grid grid-cols-1 gap-6 ${repos.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {repos.map((repo) => {
              const health = getHealthBadge(repo.pushed_at);
              const license = getLicenseType(repo.license?.spdx_id);
              const isTopStarred = repo.stargazers_count === maxStars && repos.length > 1;

              return (
                <div
                  key={repo.id}
                  className="glass relative flex flex-col rounded-2xl border border-white/10 p-5 space-y-4"
                >
                  {/* Remove button */}
                  <button
                    onClick={() => onRemoveRepo(repo.id)}
                    className="absolute top-4 right-4 text-xs text-zinc-500 hover:text-rose-400"
                    title="Remove from comparison"
                  >
                    ✕ Remove
                  </button>

                  {/* Header info */}
                  <div className="flex items-start gap-3 pr-8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                      className="h-10 w-10 rounded-xl border border-white/10 object-cover"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white text-sm">
                        {repo.name}
                      </h3>
                      <p className="text-xs text-zinc-400 truncate">
                        by {repo.owner.login}
                      </p>
                    </div>
                  </div>

                  {isTopStarred && (
                    <span className="inline-flex self-start items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                      ★ Community Leader ({formatStars(repo.stargazers_count)} stars)
                    </span>
                  )}

                  <p className="text-xs leading-relaxed text-zinc-300 line-clamp-3">
                    {repo.description || "No description provided."}
                  </p>

                  {/* Metrics & Health */}
                  <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
                    {/* Maintenance Health */}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Maintenance Health</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${health.color}`}>
                        {health.label}
                      </span>
                    </div>

                    {/* Last pushed */}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Last Commit</span>
                      <span className="font-medium text-zinc-300">
                        {timeAgo(repo.pushed_at)}
                      </span>
                    </div>

                    {/* Stars */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-500 flex items-center gap-1">
                          <IconStar className="h-3.5 w-3.5 text-amber-400" /> Stars
                        </span>
                        <span className="font-bold text-white">
                          {formatStars(repo.stargazers_count)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-violet-500 rounded-full"
                          style={{
                            width: `${Math.max((repo.stargazers_count / maxStars) * 100, 5)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Forks & Issues */}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <IconFork className="h-3.5 w-3.5" /> Forks
                      </span>
                      <span className="font-semibold text-zinc-300">
                        {formatStars(repo.forks_count)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <IconIssue className="h-3.5 w-3.5" /> Open Issues
                      </span>
                      <span className="font-semibold text-zinc-300">
                        {formatStars(repo.open_issues_count)}
                      </span>
                    </div>

                    {/* License */}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">License</span>
                      <span
                        className={`font-medium ${
                          license.type === "permissive"
                            ? "text-emerald-300"
                            : license.type === "copyleft"
                            ? "text-amber-300"
                            : "text-zinc-400"
                        }`}
                      >
                        {license.label}
                      </span>
                    </div>

                    {/* Primary Language */}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Language</span>
                      {repo.language ? (
                        <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: languageColor(repo.language) }}
                          />
                          {repo.language}
                        </span>
                      ) : (
                        <span className="text-zinc-500">N/A</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-4 flex flex-col gap-2">
                    <Link
                      href={`/repo/${repo.owner.login}/${repo.name}`}
                      className="flex items-center justify-center rounded-xl bg-violet-600/30 border border-violet-500/40 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-600/50"
                    >
                      Inspect Code & README →
                    </Link>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="glass flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs text-zinc-400 transition hover:text-white"
                    >
                      <IconExternal className="h-3.5 w-3.5" /> GitHub
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-xs text-zinc-500">
            Tip: Permissive licenses (MIT, Apache) are safest for closed-source commercial projects.
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-xs font-semibold text-white shadow-glow hover:opacity-90"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
