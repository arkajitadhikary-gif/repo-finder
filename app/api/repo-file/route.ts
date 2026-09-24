import { NextRequest, NextResponse } from "next/server";
import { ghHeaders } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const path = searchParams.get("path");
    const branch = searchParams.get("branch") || "main";

    if (!owner || !repo || !path) {
      return NextResponse.json(
        { error: "Owner, repo, and path are required" },
        { status: 400 }
      );
    }

    // Attempt to fetch raw content from raw.githubusercontent.com
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    const res = await fetch(rawUrl, {
      headers: ghHeaders("text/plain"),
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      // Fallback: master branch if branch was main
      if (branch === "main") {
        const fallbackUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${path}`;
        const fallbackRes = await fetch(fallbackUrl, {
          headers: ghHeaders("text/plain"),
          next: { revalidate: 600 },
        });
        if (fallbackRes.ok) {
          const content = await fallbackRes.text();
          return NextResponse.json({ content, path, size: content.length });
        }
      }
      return NextResponse.json(
        { error: "Could not load file content" },
        { status: res.status }
      );
    }

    const content = await res.text();
    // Safety check: binary or too huge files
    if (content.length > 500_000) {
      return NextResponse.json({
        content: content.slice(0, 500_000) + "\n\n// ... File truncated (exceeds 500KB)",
        path,
        size: content.length,
        truncated: true,
      });
    }

    return NextResponse.json({ content, path, size: content.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error reading file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
