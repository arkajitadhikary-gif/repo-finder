"use client";

import { useEffect, useMemo, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

interface TreeItem {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

interface CodeExplorerProps {
  owner: string;
  repo: string;
  defaultBranch: string;
}

function getFileIcon(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "🔷";
    case "js":
    case "jsx":
      return "🟨";
    case "py":
      return "🐍";
    case "json":
      return "📦";
    case "css":
    case "scss":
      return "🎨";
    case "html":
      return "🌐";
    case "md":
      return "📝";
    case "rs":
      return "🦀";
    case "go":
      return "🐹";
    case "yml":
    case "yaml":
      return "⚙️";
    case "svg":
    case "png":
    case "jpg":
      return "🖼️";
    default:
      return "📄";
  }
}

export default function CodeExplorer({
  owner,
  repo,
  defaultBranch,
}: CodeExplorerProps) {
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [errorTree, setErrorTree] = useState<string | null>(null);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // Load Tree
  useEffect(() => {
    let active = true;
    async function fetchTree() {
      setLoadingTree(true);
      setErrorTree(null);
      try {
        const res = await fetch(
          `/api/repo-tree?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(
            repo
          )}&branch=${encodeURIComponent(defaultBranch)}`
        );
        if (!res.ok) throw new Error("Could not load repo tree");
        const data = await res.json();
        if (active) {
          const items: TreeItem[] = data.tree || [];
          setTree(items);
          // Auto select a common starter file like package.json, README.md, or first blob
          const defaultFile =
            items.find((i) => i.path === "package.json") ||
            items.find((i) => i.path.toLowerCase().endsWith(".json")) ||
            items.find((i) => i.type === "blob");
          if (defaultFile) {
            setSelectedPath(defaultFile.path);
          }
        }
      } catch (err) {
        if (active) {
          setErrorTree(
            err instanceof Error ? err.message : "Failed to load repository files."
          );
        }
      } finally {
        if (active) setLoadingTree(false);
      }
    }
    fetchTree();
    return () => {
      active = false;
    };
  }, [owner, repo, defaultBranch]);

  // Load File Content when selectedPath changes
  useEffect(() => {
    if (!selectedPath) return;
    const currentPath = selectedPath;
    let active = true;
    async function fetchFile() {
      setLoadingFile(true);
      try {
        const res = await fetch(
          `/api/repo-file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(
            repo
          )}&branch=${encodeURIComponent(defaultBranch)}&path=${encodeURIComponent(
            currentPath
          )}`
        );
        if (!res.ok) throw new Error("Failed to load file");
        const data = await res.json();
        if (active) {
          setFileContent(data.content);
        }
      } catch {
        if (active) setFileContent("// Error loading file contents.");
      } finally {
        if (active) setLoadingFile(false);
      }
    }
    fetchFile();
    return () => {
      active = false;
    };
  }, [owner, repo, defaultBranch, selectedPath]);

  // Filtered files list
  const filteredTree = useMemo(() => {
    if (!searchFilter.trim()) return tree.filter((i) => i.type === "blob");
    const q = searchFilter.toLowerCase();
    return tree.filter(
      (i) => i.type === "blob" && i.path.toLowerCase().includes(q)
    );
  }, [tree, searchFilter]);

  // Highlighted code output
  const highlightedCode = useMemo(() => {
    if (!fileContent) return "";
    try {
      return hljs.highlightAuto(fileContent).value;
    } catch {
      return fileContent;
    }
  }, [fileContent]);

  const lineCount = useMemo(() => {
    if (!fileContent) return 0;
    return fileContent.split("\n").length;
  }, [fileContent]);

  function copyCode() {
    if (!fileContent) return;
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loadingTree) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        <p className="text-sm">Connecting to GitHub file tree…</p>
      </div>
    );
  }

  if (errorTree) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-400">
        <p className="text-rose-400 font-semibold mb-1">Could not inspect files</p>
        <p>{errorTree}</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl border border-white/10 overflow-hidden flex flex-col md:flex-row h-[700px]">
      {/* Left Sidebar: File Tree */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-base-950/60">
        {/* Search Files */}
        <div className="p-3 border-b border-white/10">
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search files (e.g. tsx, config)…"
            className="w-full rounded-xl bg-white/5 px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none border border-white/5 focus:border-violet-500/50"
          />
          <p className="text-[10px] text-zinc-500 mt-1.5 px-1">
            Showing {filteredTree.length} files on branch{" "}
            <span className="text-zinc-400 font-mono">{defaultBranch}</span>
          </p>
        </div>

        {/* Tree items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
          {filteredTree.map((item) => {
            const isSelected = item.path === selectedPath;
            return (
              <button
                key={item.path}
                onClick={() => setSelectedPath(item.path)}
                className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition truncate ${
                  isSelected
                    ? "bg-violet-600/30 text-white font-medium border border-violet-500/40"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
                title={item.path}
              >
                <span className="shrink-0 text-xs">{getFileIcon(item.path)}</span>
                <span className="truncate">{item.path}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Code Viewer */}
      <div className="flex-1 flex flex-col min-w-0 bg-base-950/40">
        {/* File Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-base-950/80">
          <div className="flex items-center gap-2 truncate">
            <span className="text-sm font-semibold text-white font-mono truncate">
              {selectedPath || "Select a file"}
            </span>
            {lineCount > 0 && (
              <span className="text-[11px] text-zinc-500 shrink-0">
                ({lineCount} lines)
              </span>
            )}
          </div>
          <button
            onClick={copyCode}
            disabled={!fileContent || loadingFile}
            className="shrink-0 glass rounded-lg px-3 py-1 text-xs font-medium text-zinc-300 transition hover:border-violet-500/50 hover:text-white"
          >
            {copied ? "✓ Copied" : "Copy Code"}
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
          {loadingFile ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
              Loading file…
            </div>
          ) : fileContent !== null ? (
            <div className="flex">
              {/* Line numbers */}
              <div
                className="select-none pr-4 text-right text-zinc-600 border-r border-white/5"
                style={{ minWidth: "3rem" }}
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              {/* Code */}
              <div className="pl-4 flex-1 overflow-x-auto">
                <pre>
                  <code
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                    className="hljs bg-transparent !p-0"
                  />
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">
              Select a file from the left to view its code.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
