"use client";

import { useState } from "react";
import type { Blueprint } from "@/lib/architect";
import { IconSparkles } from "./icons";

interface BlueprintModalProps {
  blueprint: Blueprint | null;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlueprintModal({
  blueprint,
  loading,
  isOpen,
  onClose,
}: BlueprintModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  function copyRoadmap() {
    if (!blueprint) return;
    const md = [
      `# ${blueprint.projectTitle}`,
      "",
      blueprint.overview,
      "",
      "## 🏗️ Architecture Stack",
      ...blueprint.recommendedRepos.map((r) => `- **${r.role}**: [${r.name}](${r.url})`),
      "",
      "## 🚀 Implementation Roadmap",
      ...blueprint.steps.map((s) => [
        `### Step ${s.step}: ${s.title} (${s.stackComponent})`,
        s.description,
        s.sampleCode ? `\`\`\`bash\n${s.sampleCode}\n\`\`\`` : "",
        "",
      ].join("\n")),
      "## ⚠️ Key Challenges & Considerations",
      ...blueprint.keyChallenges.map((c) => `- ${c}`),
    ].join("\n");

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-white/10 bg-base-950 p-6 shadow-2xl sm:p-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-glow text-white">
              <IconSparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Starter Blueprint & Roadmap
                {blueprint?.isAiPowered && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    Groq Llama 3.3 AI
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Step-by-step technical guide to assemble your stack
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-6 pr-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <p className="text-sm">Architecting your custom blueprint with Groq AI…</p>
            </div>
          ) : blueprint ? (
            <>
              {/* Overview */}
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4.5">
                <h3 className="text-sm font-semibold text-violet-300">Overview</h3>
                <p className="mt-1 text-sm text-zinc-300 leading-relaxed">
                  {blueprint.overview}
                </p>
              </div>

              {/* Recommended Repos */}
              {blueprint.recommendedRepos?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                    Recommended Stack & Repositories
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {blueprint.recommendedRepos.map((r) => (
                      <a
                        key={r.name}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="glass flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 transition hover:border-violet-500/40 hover:text-white"
                      >
                        <span className="font-semibold text-white truncate mr-2">
                          {r.name}
                        </span>
                        <span className="text-[11px] text-zinc-500 shrink-0">
                          {r.role}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                  Step-by-Step Implementation Roadmap
                </h4>
                <div className="space-y-4">
                  {blueprint.steps.map((s) => (
                    <div
                      key={s.step}
                      className="glass rounded-2xl p-4.5 border border-white/5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300 border border-violet-500/30">
                            {s.step}
                          </span>
                          <h5 className="text-sm font-semibold text-white">
                            {s.title}
                          </h5>
                        </div>
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                          {s.stackComponent}
                        </span>
                      </div>
                      <p className="text-xs leading-5 text-zinc-300 pl-8">
                        {s.description}
                      </p>
                      {s.sampleCode && (
                        <div className="ml-8 mt-2 rounded-xl bg-black/60 p-3 font-mono text-[11px] text-emerald-300 border border-white/5 overflow-x-auto">
                          <pre>{s.sampleCode}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Challenges */}
              {blueprint.keyChallenges?.length > 0 && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    ⚠️ Pitfalls & Architecture Tips
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-zinc-300">
                    {blueprint.keyChallenges.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-sm text-zinc-500 py-10">
              No blueprint available.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-xs text-zinc-500">
            Export blueprint directly into your documentation
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={copyRoadmap}
              disabled={!blueprint}
              className="glass rounded-xl px-4 py-2 text-xs font-semibold text-white transition hover:border-violet-500/50"
            >
              {copied ? "✓ Copied to Clipboard!" : "Copy Full Roadmap"}
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-glow hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
