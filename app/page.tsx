"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import RepoCard, { type RepoResult } from "@/components/RepoCard";
import {
  IconSearch,
  IconSparkles,
} from "@/components/icons";

type SearchMode = "smart" | "simple";

interface SearchResponse {
  mode: SearchMode;
  keywords: string[];
  language: string | null;
  results: RepoResult[];
  error?: string;
}

const SUGGESTIONS = [
  "Todo app with React",
  "AI chatbot in Python",
  "E-commerce website",
  "Netflix clone",
  "Expense tracker",
  "Real-time chat app",
];

const MODE_HINTS: Record<SearchMode, string> = {
  smart:
    "Smart Mode reads your description, extracts the key concepts and ranks the best-matching repositories.",
  simple: "Simple Mode runs your exact words as a plain GitHub keyword search.",
};

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("smart");
  const [results, setResults] = useState<RepoResult[] | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [language, setLanguage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<string | null>(null);
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

  async function runSearch(q: string, m: SearchMode) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setSearched(trimmed);
    setResults(null);
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
        setKeywords(data.keywords ?? []);
        setLanguage(data.language);
        setTimeout(
          () => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
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
            <span className="text-lg font-bold tracking-tight">
              Repo<span className="text-gradient">Finder</span>
            </span>
          </Link>
        </div>
      </header>

      {/* ---------------- Hero ---------------- */}
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24">
          <h1 className="animate-fade-up text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            From idea to repository
            <br />
            <span className="text-gradient">in seconds.</span>
          </h1>

          <p className="animate-fade-up mx-auto mt-5 max-w-xl text-balance text-base leading-7 text-zinc-400 [animation-delay:160ms] sm:text-lg">
            Describe what you want to build — RepoFinder finds the perfect
            open-source GitHub repositories for your project, right here on
            this page.
          </p>

          {/* ------------- Search box ------------- */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query, mode);
            }}
            className="animate-fade-up mx-auto mt-10 max-w-2xl [animation-delay:240ms]"
          >
            <div className="glass group relative rounded-2xl p-1.5 transition focus-within:border-violet-500/50 focus-within:shadow-glow">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. I want to build a todo app with dark mode…"
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
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Searching
                    </>
                  ) : (
                    <>
                      <IconSearch className="h-4 w-4" />
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* --------- Mode toggle --------- */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <div className="glass inline-flex rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setMode("smart")}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    mode === "smart"
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-glow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <IconSparkles className="h-3.5 w-3.5" />
                  Smart Mode
                </button>
                <button
                  type="button"
                  onClick={() => setMode("simple")}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    mode === "simple"
                      ? "bg-gradient-to-r from-sky-600 to-violet-600 text-white shadow-glow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <IconSearch className="h-3.5 w-3.5" />
                  Simple Mode
                </button>
              </div>
              <p className="text-xs text-zinc-500">{MODE_HINTS[mode]}</p>
            </div>

            {/* --------- Suggestions --------- */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setQuery(s);
                    runSearch(s, mode);
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-zinc-400 transition hover:border-violet-500/40 hover:text-violet-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </form>
        </section>

        {/* ---------------- Results ---------------- */}
        <section ref={resultsRef} className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-44" />
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="glass mx-auto max-w-lg rounded-2xl border-red-500/20 p-8 text-center">
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={() => searched && runSearch(searched, mode)}
                className="mt-4 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium transition hover:bg-white/15"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty result */}
          {results !== null && !loading && !error && results.length === 0 && (
            <div className="glass mx-auto max-w-lg rounded-2xl p-10 text-center">
              <p className="text-3xl">🔍</p>
              <h2 className="mt-3 text-lg font-semibold">No repositories found</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Try describing your project with different words, or switch to
                Simple Mode.
              </p>
            </div>
          )}

          {/* Result list */}
          {results !== null && results.length > 0 && !loading && (
            <div className="animate-fade-in">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    Top repositories for{" "}
                    <span className="text-gradient">{searched}</span>
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span>{results.length} results</span>
                    {language && (
                      <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 font-medium text-sky-300">
                        {language}
                      </span>
                    )}
                    {keywords.slice(0, 6).map((k) => (
                      <span
                        key={k}
                        className="rounded-full bg-white/5 px-2.5 py-0.5 text-zinc-400"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-500">
                  Click any card to read the repository here →
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

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
