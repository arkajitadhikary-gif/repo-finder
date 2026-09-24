"use client";

import { useState } from "react";
import Markdown from "./Markdown";
import CodeExplorer from "./CodeExplorer";

interface RepoDetailTabsProps {
  readme: string | null;
  imageBase: string;
  owner: string;
  repo: string;
  defaultBranch: string;
}

export default function RepoDetailTabs({
  readme,
  imageBase,
  owner,
  repo,
  defaultBranch,
}: RepoDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<"readme" | "code">("readme");

  return (
    <div className="mt-8 space-y-6">
      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("readme")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "readme"
              ? "bg-violet-600/30 text-white border border-violet-500/40 shadow-glow"
              : "text-zinc-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <svg
            className="h-4 w-4 text-violet-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          README.md
        </button>

        <button
          onClick={() => setActiveTab("code")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "code"
              ? "bg-violet-600/30 text-white border border-violet-500/40 shadow-glow"
              : "text-zinc-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <svg
            className="h-4 w-4 text-sky-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          In-App Code Explorer
          <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-medium text-sky-300">
            Interactive
          </span>
        </button>
      </div>

      {/* Tab 1: README */}
      {activeTab === "readme" && (
        <section className="glass rounded-3xl p-6 sm:p-10 animate-fade-in">
          {readme ? (
            <Markdown imageBase={imageBase}>{readme}</Markdown>
          ) : (
            <div className="py-12 text-center text-sm text-zinc-500">
              This repository has no README file. You can browse the files directly in the{" "}
              <button
                onClick={() => setActiveTab("code")}
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                Code Explorer tab
              </button>
              .
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Code Explorer */}
      {activeTab === "code" && (
        <section className="animate-fade-in">
          <CodeExplorer
            owner={owner}
            repo={repo}
            defaultBranch={defaultBranch}
          />
        </section>
      )}
    </div>
  );
}
