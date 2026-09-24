import { NextRequest, NextResponse } from "next/server";
import { searchRepositories, type GitHubRepo } from "@/lib/github";
import { buildSmartPlan, mergeAndRank } from "@/lib/smart-search";
import {
  analyzeProjectArchitecture,
  generateRepoInsights,
  type ArchitectPlan,
} from "@/lib/architect";

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

    /* ---------------- Smart Architect Mode ---------------- */
    // Concurrently run heuristic search planning and AI/heuristic architecture analysis
    const [smartPlan, architectPlan] = await Promise.all([
      Promise.resolve(buildSmartPlan(query)),
      analyzeProjectArchitecture(query),
    ]);

    // Gather queries from both smartPlan and architect layers
    const layerQueries = architectPlan.layers.map((l) => l.searchQuery);
    const combinedQueries = Array.from(
      new Set([...smartPlan.queries, ...layerQueries])
    ).slice(0, 6);

    // Fetch batches for each query concurrently
    const batches: GitHubRepo[][] = await Promise.all(
      combinedQueries.map((q) =>
        searchRepositories(q, 15).catch(() => [] as GitHubRepo[])
      )
    );

    let ranked = mergeAndRank(batches, smartPlan.keywords).slice(0, MAX_RESULTS);

    // Fallback chain if results are sparse
    if (ranked.length < 5) {
      const primary = smartPlan.keywords[0] ?? query;
      const langQ = smartPlan.language ? ` language:${smartPlan.language}` : "";
      const fallbacks = [
        `${primary} in:name,description${langQ}`,
        `${primary} in:name,description`,
      ];
      for (const q of fallbacks) {
        const extra = await searchRepositories(q, 20).catch(
          () => [] as GitHubRepo[]
        );
        batches.push(extra);
        ranked = mergeAndRank(batches, smartPlan.keywords).slice(0, MAX_RESULTS);
        if (ranked.length >= 5) break;
      }
    }

    // Generate "Why this repo?" insights using Groq (or fallback)
    const whyRepoMap = await generateRepoInsights(query, ranked.slice(0, 12));

    // Populate layers with their best-matching repos
    const populatedLayers = await Promise.all(
      architectPlan.layers.map(async (layer) => {
        const layerRepos = await searchRepositories(layer.searchQuery, 4).catch(
          () => [] as GitHubRepo[]
        );
        return {
          ...layer,
          repos: layerRepos.map((r) => ({
            ...r,
            insight: whyRepoMap[r.full_name] ?? undefined,
          })),
        };
      })
    );

    // Attach insights to ranked results
    const resultsWithInsights = ranked.map((repo) => ({
      ...repo,
      insight: whyRepoMap[repo.full_name] ?? undefined,
    }));

    const enrichedArchitectPlan: ArchitectPlan = {
      ...architectPlan,
      layers: populatedLayers,
      whyRepoMap,
    };

    return NextResponse.json({
      mode,
      keywords: smartPlan.keywords,
      language: smartPlan.language,
      results: resultsWithInsights,
      architectPlan: enrichedArchitectPlan,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
