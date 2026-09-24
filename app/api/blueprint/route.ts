import { NextRequest, NextResponse } from "next/server";
import { generateProjectBlueprint } from "@/lib/architect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      query?: string;
      selectedRepos?: { full_name: string; description: string; language: string }[];
    };

    const query = (body.query ?? "").trim();
    if (!query) {
      return NextResponse.json(
        { error: "Query is required to generate a blueprint." },
        { status: 400 }
      );
    }

    const blueprint = await generateProjectBlueprint(
      query,
      body.selectedRepos ?? []
    );

    return NextResponse.json(blueprint);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate blueprint";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
