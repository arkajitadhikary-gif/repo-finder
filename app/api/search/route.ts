import { NextRequest, NextResponse } from "next/server";
import { searchRepositories, type GitHubRepo } from "@/lib/github";
import { buildSmartPlan, mergeAndRank } from "@/lib/smart-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RESULTS = 24;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      query?: string;
      mode?: "simple" | "smart";
    };
    const query = (body.query ?? "").trim();
    const mode = body.mode === "simple" ? "simple" : "smart";

    if (!query) {
      return NextResponse.json(
        { error: "Please enter what you want to build." },
        { status: 400 }
      );
    }
    if (query.length > 400) {
      return NextResponse.json(
        { error: "Query is too long (max 400 characters)." },
        { status: 400 }
      );
    }

    if (mode === "simple") {
      const items = await searchRepositories(
        `${query} in:name,description,topics`,
        25
      );
      return NextResponse.json({
        mode,
        keywords: [query],
        language: null,
        results: items.slice(0, MAX_RESULTS),
      });
    }

    /* ---------------- Smart Mode ---------------- */
    const plan = buildSmartPlan(query);
    const batches: GitHubRepo[][] = await Promise.all(
      plan.queries.map((q) =>
        searchRepositories(q, 15).catch(() => [] as GitHubRepo[])
      )
    );

    const rank = () =>
      mergeAndRank(batches, plan.keywords).slice(0, MAX_RESULTS);

    // Fallback chain: if the multi-angle queries came back thin, relax.
    if (rank().length < 5) {
      const primary = plan.keywords[0] ?? query;
      const langQ = plan.language ? ` language:${plan.language}` : "";
      const fallbacks = [
        `${primary} in:name,description${langQ}`,
        `${primary} in:name,description`,
      ];
      for (const q of fallbacks) {
        const extra = await searchRepositories(q, 20).catch(
          () => [] as GitHubRepo[]
        );
        batches.push(extra);
        if (rank().length >= 5) break;
      }
    }

    return NextResponse.json({
      mode,
      keywords: plan.keywords,
      language: plan.language,
      results: rank(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
