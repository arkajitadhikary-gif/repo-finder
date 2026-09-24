"use client";

import { useState } from "react";
import { IconCopy } from "./icons";

export default function CloneButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const command = `git clone ${url}.git`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — select fallback.
      window.prompt("Copy this command:", command);
    }
  }

  return (
    <button
      onClick={copy}
      className="glass flex min-w-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm transition hover:border-violet-500/40"
      title="Copy git clone command"
    >
      <IconCopy className="h-4 w-4 shrink-0 text-zinc-400" />
      <code className="truncate font-mono text-xs text-zinc-400">{command}</code>
      {copied && (
        <span className="animate-fade-in shrink-0 text-xs font-semibold text-emerald-400">
          Copied!
        </span>
      )}
    </button>
  );
}
