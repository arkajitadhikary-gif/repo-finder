import { NextRequest, NextResponse } from "next/server";
import { ghHeaders } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch") || "main";

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Owner and repo are required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(
        branch
      )}?recursive=1`,
      {
        headers: ghHeaders(),
        next: { revalidate: 600 },
      }
    );

    if (!res.ok) {
      // Fallback: try "master" branch if "main" failed
      if (branch === "main") {
        const fallbackRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`,
          {
            headers: ghHeaders(),
            next: { revalidate: 600 },
          }
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          return NextResponse.json({
            tree: filterTree(fallbackData.tree || []),
            branch: "master",
          });
        }
      }
      return NextResponse.json(
        { error: `Failed to fetch repo tree (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      tree: filterTree(data.tree || []),
      branch,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error loading files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function filterTree(
  tree: { path: string; mode: string; type: "blob" | "tree"; size?: number }[]
) {
  // Ignore git internals and massive dependency locks/folders for clean navigation
  const ignoredPrefixes = [".git/", "node_modules/", ".next/", "dist/", "build/"];
  return tree
    .filter(
      (item) => !ignoredPrefixes.some((p) => item.path.startsWith(p))
    )
    .slice(0, 1000); // safety cap
}
