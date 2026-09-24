"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import RepoCard, { type RepoResult } from "@/components/RepoCard";
import BlueprintModal from "@/components/BlueprintModal";
import RepoComparisonModal from "@/components/RepoComparisonModal";
import type { ArchitectPlan, Blueprint } from "@/lib/architect";
import { formatStars } from "@/lib/format";
import {
  IconSearch,
  IconSparkles,
  IconStar,
  IconFork,
} from "@/components/icons";

type SearchMode = "smart" | "simple";

interface SearchResponse {
  mode: SearchMode;
  keywords: string[];
  language: string | null;
  results: RepoResult[];
  architectPlan?: ArchitectPlan;
  error?: string;
}

const SUGGESTIONS = [
  "Real-time collaborative whiteboard",
  "AI chatbot with RAG in Python",
  "Full-stack e-commerce with Next.js & Stripe",
  "Multiplayer card game with WebSockets",
  "Self-hosted personal finance & expense tracker",
  "Video conferencing app with WebRTC",
];

const MODE_HINTS: Record<SearchMode, string> = {
  smart:
    "AI Architect Mode breaks your idea into architectural layers, matches repositories for each tier, and creates blueprints.",
  simple: "Simple Mode executes an exact keyword search against GitHub descriptions and topics.",
};

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("smart");
  const [results, setResults] = useState<RepoResult[] | null>(null);
  const [architectPlan, setArchitectPlan] = useState<ArchitectPlan | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [language, setLanguage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<string | null>(null);

  // Comparison State
  const [comparingRepos, setComparingRepos] = useState<RepoResult[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Blueprint State
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [blueprintLoading, setBlueprintLoading] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Press "/" anywhere to jump into the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleCompare(repo: RepoResult) {
    setComparingRepos((prev) => {
      const exists = prev.some((r) => r.id === repo.id);
      if (exists) {
        return prev.filter((r) => r.id !== repo.id);
      }
      if (prev.length >= 3) {
        // Replace the oldest
        return [...prev.slice(1), repo];
      }
      return [...prev, repo];
    });
  }

  async function handleGenerateBlueprint() {
    if (!searched) return;
    setIsBlueprintOpen(true);
    setBlueprintLoading(true);
    try {
      const topRepos = (results || []).slice(0, 4).map((r) => ({
        full_name: r.full_name,
        description: r.description || "",
        language: r.language || "Unknown",
      }));

      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searched,
          selectedRepos: topRepos,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate blueprint");
      const data = (await res.json()) as Blueprint;
      setBlueprint(data);
    } catch {
      // Failed to generate blueprint
    } finally {
      setBlueprintLoading(false);
    }
  }

  async function runSearch(q: string, m: SearchMode) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setSearched(trimmed);
    setResults(null);
    setArchitectPlan(null);
    setComparingRepos([]);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, mode: m }),
      });
      const data = (await res.json()) as SearchResponse;
      if (!res.ok || data.error) {
        setError(data.error || "Search failed. Please try again.");
      } else {
        setResults(data.results);
        setArchitectPlan(data.architectPlan ?? null);
        setKeywords(data.keywords ?? []);
        setLanguage(data.language);
        setTimeout(
          () =>
            resultsRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          100
        );
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* ---------------- Navbar ---------------- */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-base-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-glow">
              <IconSearch className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">
              Repo<span className="text-gradient">Finder</span>
            </span>
          </Link>

          {/* Quick status pill */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="hidden sm:inline">AI Project Architect & Code Explorer Ready</span>
          </div>
        </div>
      </header>

      {/* ---------------- Hero ---------------- */}
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24">
          <h1 className="animate-fade-up text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl text-white">
            From idea to repository
            <br />
            <span className="text-gradient">in seconds.</span>
          </h1>

          <p className="animate-fade-up mx-auto mt-5 max-w-xl text-balance text-base leading-7 text-zinc-400 sm:text-lg">
            Describe what you want to build — RepoFinder breaks down the architecture
            and finds the perfect open-source GitHub repositories for your project.
          </p>

          {/* ------------- Search box ------------- */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query, mode);
            }}
            className="animate-fade-up mx-auto mt-10 max-w-2xl"
          >
            <div className="glass group relative rounded-2xl p-1.5 transition focus-within:border-violet-500/50 focus-within:shadow-glow">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Real-time collaborative whiteboard with canvas…"
                    maxLength={400}
                    className="w-full bg-transparent py-3.5 pl-12 pr-14 text-[15px] text-white placeholder-zinc-500 outline-none"
                    aria-label="Describe the project you want to build"
                  />
                  <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-zinc-500 md:block">
                    /
                  </kbd>
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Architecting…
                    </>
                  ) : (
                    <>
                      <IconSparkles className="h-4 w-4" />
                      Architect & Find
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mode selector */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 text-xs sm:flex-row">
              <div className="glass inline-flex rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setMode("smart")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                    mode === "smart"
                      ? "bg-violet-600 text-white shadow-glow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <IconSparkles className="h-3.5 w-3.5" />
                  AI Architect Mode
                </button>
                <button
                  type="button"
                  onClick={() => setMode("simple")}
                  className={`rounded-lg px-3 py-1.5 font-medium transition ${
                    mode === "simple"
                      ? "bg-violet-600 text-white shadow-glow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Simple Keyword
                </button>
              </div>
              <p className="text-zinc-500 max-w-sm text-center sm:text-right">
                {MODE_HINTS[mode]}
              </p>
            </div>
          </form>

          {/* ------------- Suggestions ------------- */}
          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-zinc-500">Try ideas:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  runSearch(s, mode);
                }}
                className="glass rounded-full px-3 py-1 text-xs text-zinc-400 transition hover:border-violet-500/40 hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* ---------------- Results Section ---------------- */}
        <section ref={resultsRef} className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          {error && (
            <div className="glass mx-auto max-w-xl rounded-2xl border-rose-500/30 p-5 text-center text-sm text-rose-300">
              <p className="font-semibold">Search could not be completed</p>
              <p className="mt-1 text-xs text-rose-400/80">{error}</p>
            </div>
          )}

          {/* 1. Architectural Layers Breakdown */}
          {architectPlan && architectPlan.layers.length > 0 && (
            <div className="mb-12 rounded-3xl border border-violet-500/30 bg-gradient-to-b from-violet-950/20 to-base-950 p-6 sm:p-8 animate-fade-in shadow-glow">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      <IconSparkles className="h-4 w-4" />
                    </span>
                    <h2 className="text-lg font-bold text-white">
                      Architecture Blueprint & Recommended Layers
                    </h2>
                    {architectPlan.isAiPowered && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Groq Llama 3.3
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Recommended Pattern:{" "}
                    <span className="text-violet-300 font-medium">
                      {architectPlan.suggestedPattern}
                    </span>
                  </p>
                </div>

                {/* Generate Blueprint Button */}
                <button
                  type="button"
                  onClick={handleGenerateBlueprint}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-xs font-semibold text-white shadow-glow transition hover:opacity-90 self-start sm:self-auto shrink-0"
                >
                  <IconSparkles className="h-4 w-4" />
                  Generate Starter Blueprint & Roadmap
                </button>
              </div>

              {/* Layer Cards */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                {architectPlan.layers.map((layer) => (
                  <div
                    key={layer.id}
                    className="glass flex flex-col rounded-2xl p-5 border border-white/10 bg-base-900/40 space-y-3.5"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                          {layer.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-2">
                        {layer.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {layer.description}
                      </p>
                    </div>

                    {/* Tech Stack Pills */}
                    {layer.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {layer.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Layer matched repos */}
                    {layer.repos && layer.repos.length > 0 && (
                      <div className="mt-auto pt-3 border-t border-white/5 space-y-2">
                        <p className="text-[11px] font-semibold text-zinc-400">
                          Matched Repositories:
                        </p>
                        {layer.repos.slice(0, 2).map((r) => {
                          const isComp = comparingRepos.some((c) => c.id === r.id);
                          return (
                            <div
                              key={r.id}
                              className="glass flex items-center justify-between rounded-xl p-2 text-xs transition hover:border-white/20"
                            >
                              <Link
                                href={`/repo/${r.owner.login}/${r.name}`}
                                className="truncate font-medium text-white hover:text-violet-300 mr-2"
                              >
                                {r.name}
                              </Link>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                                  <IconStar className="h-3 w-3 text-amber-400" />
                                  {formatStars(r.stargazers_count)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleCompare(r as RepoResult)}
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                                    isComp
                                      ? "bg-violet-600 text-white"
                                      : "text-zinc-500 hover:text-white"
                                  }`}
                                  title="Add to comparison"
                                >
                                  {isComp ? "✓" : "+"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Main Ranked Results Feed */}
          {results && (
            <div>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {results.length > 0
                      ? `Found ${results.length} Repositories`
                      : "No repositories found"}
                  </h2>
                  {keywords.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                      <span>Concepts:</span>
                      {keywords.map((k) => (
                        <span
                          key={k}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300 font-mono"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-500">
                  Select 2-3 repositories to compare head-to-head →
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((repo) => (
                  <RepoCard
                    key={repo.id}
                    repo={repo}
                    isComparing={comparingRepos.some((r) => r.id === repo.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ---------------- Floating Comparison Dock ---------------- */}
      {comparingRepos.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-2xl border border-violet-500/40 bg-base-950/95 px-5 py-3 shadow-2xl backdrop-blur-xl animate-fade-up">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {comparingRepos.map((r) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={r.id}
                  src={r.owner.avatar_url}
                  alt={r.owner.login}
                  className="h-7 w-7 rounded-full border-2 border-base-950 object-cover"
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-white">
              {comparingRepos.length}/3 Repos Selected
            </span>
          </div>

          <button
            onClick={() => setComparingRepos([])}
            className="text-xs text-zinc-400 hover:text-rose-400 transition"
          >
            Clear
          </button>

          <button
            onClick={() => setIsComparisonOpen(true)}
            disabled={comparingRepos.length < 2}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-40"
          >
            Compare Head-to-Head ⚔️
          </button>
        </div>
      )}

      {/* ---------------- Modals ---------------- */}
      <BlueprintModal
        blueprint={blueprint}
        loading={blueprintLoading}
        isOpen={isBlueprintOpen}
        onClose={() => setIsBlueprintOpen(false)}
      />

      <RepoComparisonModal
        repos={comparingRepos}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onRemoveRepo={(id) =>
          setComparingRepos((prev) => prev.filter((r) => r.id !== id))
        }
      />

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-zinc-500 sm:flex-row sm:px-6">
          <p>
            RepoFinder — open source under the MIT license. Data from the{" "}
            <a
              href="https://docs.github.com/rest/search"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 underline-offset-2 hover:text-violet-300 hover:underline"
            >
              GitHub REST API
            </a>
            .
          </p>
          <p className="flex items-center gap-1.5">
            Press
            <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">
              /
            </kbd>
            to search faster
          </p>
        </div>
      </footer>
    </div>
  );
}
