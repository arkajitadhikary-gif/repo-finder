import Groq from "groq-sdk";
import type { GitHubRepo } from "./github";

export interface ArchitectureLayer {
  id: string;
  title: string;
  category: "frontend" | "backend" | "database" | "realtime" | "ai" | "tools";
  description: string;
  searchQuery: string;
  techStack: string[];
  repos?: (GitHubRepo & { insight?: string })[];
}

export interface ArchitectPlan {
  ideaSummary: string;
  suggestedPattern: string;
  layers: ArchitectureLayer[];
  whyRepoMap: Record<string, string>;
  isAiPowered: boolean;
}

export interface BlueprintStep {
  step: number;
  title: string;
  description: string;
  stackComponent: string;
  sampleCode?: string;
}

export interface Blueprint {
  projectTitle: string;
  overview: string;
  steps: BlueprintStep[];
  keyChallenges: string[];
  recommendedRepos: { name: string; role: string; url: string }[];
  isAiPowered: boolean;
}

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

/**
 * Preferred model priority list — the first active text generation model
 * available on Groq will be selected automatically.
 * We probe the model list once per cold-start and cache the result.
 */
const MODEL_PRIORITY = [
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "gemma-7b-it",
];

let _cachedModel: string | null = null;

async function getBestModel(groq: Groq): Promise<string> {
  if (_cachedModel) return _cachedModel;
  try {
    const list = await groq.models.list();
    const activeIds = new Set(
      (list.data as { id: string; active?: boolean }[])
        .filter((m) => m.active !== false)
        .map((m) => m.id)
    );
    for (const m of MODEL_PRIORITY) {
      if (activeIds.has(m)) {
        _cachedModel = m;
        console.log(`[Groq] Selected model: ${m}`);
        return m;
      }
    }
    // Fall back to the first valid chat model in the list (ignoring audio & guard models)
    const chatCandidate = (list.data as { id: string }[]).find(
      (m) =>
        !m.id.includes("whisper") &&
        !m.id.includes("guard") &&
        !m.id.includes("orpheus") &&
        !m.id.includes("safeguard")
    )?.id;
    if (chatCandidate) {
      _cachedModel = chatCandidate;
      console.log(`[Groq] Fallback to chat candidate model: ${chatCandidate}`);
      return chatCandidate;
    }
  } catch {
    // If listing fails, try the first priority model
  }
  _cachedModel = "qwen/qwen3.8-27b";
  return _cachedModel;
}

/* ------------------------------------------------------------------ */
/* 1. Architecture Breakdown (LLM or Heuristic)                       */
/* ------------------------------------------------------------------ */

export async function analyzeProjectArchitecture(
  query: string
): Promise<ArchitectPlan> {
  const groq = getGroqClient();

  if (groq) {
    try {
      const model = await getBestModel(groq);
      const response = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `You are an elite principal software architect.
A developer comes to you with a project idea. Your task is to break down this project idea into 2 to 4 distinct architectural layers needed to build it end-to-end.
For example, for "realtime collaborative whiteboard":
- Layer 1: "Frontend & Interactive Canvas" (Fabric.js, Tldraw, React) -> searchQuery: "whiteboard canvas fabricjs language:typescript"
- Layer 2: "Realtime WebSocket Server" (Socket.io, WS, Go) -> searchQuery: "realtime websocket collaboration server"
- Layer 3: "State Sync & CRDT / Storage" (Yjs, Automerge, Redis) -> searchQuery: "yjs crdt collaboration redis"

Search queries must be realistic, targeted GitHub search strings (keep them under 6 words, prefer good keywords, you can append language:typescript or language:python if relevant).

You MUST respond strictly with a valid JSON object matching this schema:
{
  "ideaSummary": "Concise 1-sentence description of the target application",
  "suggestedPattern": "Short architectural pattern name (e.g. Client-Server with CRDT WebSockets)",
  "layers": [
    {
      "id": "unique-slug",
      "title": "Layer Name",
      "category": "frontend" | "backend" | "database" | "realtime" | "ai" | "tools",
      "description": "One sentence explaining what this layer handles in the system",
      "searchQuery": "targeted github search query",
      "techStack": ["Tool1", "Tool2"]
    }
  ]
}`,
          },
          {
            role: "user",
            content: `Break down this project idea into architectural layers: "${query}"`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_completion_tokens: 1024,
      });

      const raw = response.choices[0]?.message?.content ?? "";
      const parsed = JSON.parse(raw) as {
        ideaSummary: string;
        suggestedPattern: string;
        layers: {
          id: string;
          title: string;
          category: ArchitectureLayer["category"];
          description: string;
          searchQuery: string;
          techStack: string[];
        }[];
      };

      if (parsed.layers && parsed.layers.length > 0) {
        return {
          ideaSummary: parsed.ideaSummary || `Architecture for: ${query}`,
          suggestedPattern:
            parsed.suggestedPattern || "Modern Full-Stack Architecture",
          layers: parsed.layers.map((l, idx) => ({
            id: l.id || `layer-${idx + 1}`,
            title: l.title || `Layer ${idx + 1}`,
            category: l.category || "frontend",
            description: l.description || "",
            searchQuery: l.searchQuery || query,
            techStack: Array.isArray(l.techStack) ? l.techStack : [],
          })),
          whyRepoMap: {},
          isAiPowered: true,
        };
      }
    } catch (err) {
      console.warn("Groq architecture analysis failed, falling back to heuristics:", err);
    }
  }

  // Fallback: Heuristic Breakdown
  return fallbackHeuristicArchitecture(query);
}

function fallbackHeuristicArchitecture(query: string): ArchitectPlan {
  const q = query.toLowerCase();
  const layers: ArchitectureLayer[] = [];

  const isRealtime = /real-?time|chat|multiplayer|collaborative|socket|live|streaming/.test(q);
  const isAi = /ai|llm|gpt|chatbot|rag|agent|embedding|bot|vision|machine-?learning/.test(q);
  const isEcom = /ecommerce|e-commerce|store|shop|cart|stripe|payment/.test(q);
  const isMobile = /mobile|react-native|flutter|ios|android/.test(q);

  // Layer 1: Client / UI
  if (isMobile) {
    layers.push({
      id: "mobile-ui",
      title: "Mobile App & UI Layer",
      category: "frontend",
      description: "Cross-platform mobile application interface and navigation",
      searchQuery: `${query} mobile app`,
      techStack: ["React Native", "Flutter", "Tailwind"],
    });
  } else {
    layers.push({
      id: "frontend-ui",
      title: "Frontend & User Interface",
      category: "frontend",
      description: "Responsive web client, component layouts, and user interactions",
      searchQuery: `${query} frontend react nextjs`,
      techStack: ["Next.js", "React", "Tailwind CSS"],
    });
  }

  // Layer 2: Core Domain / Engine
  if (isRealtime) {
    layers.push({
      id: "realtime-sync",
      title: "Real-Time WebSocket & Sync Engine",
      category: "realtime",
      description: "Event handling, instant state broadcast, and presence management",
      searchQuery: `${query} socket websocket realtime`,
      techStack: ["Socket.io", "Yjs", "WebSockets"],
    });
  } else if (isAi) {
    layers.push({
      id: "ai-orchestration",
      title: "AI & Model Orchestration",
      category: "ai",
      description: "Prompt pipeline, LLM streaming, vector search, and agent loops",
      searchQuery: `${query} llm ai agent python`,
      techStack: ["LangChain", "Groq / OpenAI", "ChromaDB"],
    });
  } else if (isEcom) {
    layers.push({
      id: "checkout-inventory",
      title: "Cart & Checkout Flow",
      category: "backend",
      description: "Product catalog, cart session management, and payment gateway integration",
      searchQuery: `${query} store cart stripe ecommerce`,
      techStack: ["Stripe", "Next.js Commerce", "Medusa"],
    });
  } else {
    layers.push({
      id: "backend-api",
      title: "Backend API & Business Logic",
      category: "backend",
      description: "REST/GraphQL endpoints, request validation, and domain logic",
      searchQuery: `${query} backend api nodejs`,
      techStack: ["Node.js", "Express / Fastify", "REST API"],
    });
  }

  // Layer 3: Persistence & Auth
  layers.push({
    id: "data-auth",
    title: "Database, Auth & Persistence",
    category: "database",
    description: "User authentication, session tokens, and database schemas",
    searchQuery: `${query} supabase prisma auth postgres`,
    techStack: ["PostgreSQL", "Prisma / Drizzle", "Supabase / Auth.js"],
  });

  return {
    ideaSummary: `Architecture blueprint for: "${query}"`,
    suggestedPattern: isRealtime
      ? "Client-Server with Event-Driven Realtime WebSockets"
      : isAi
      ? "AI Agent Pipeline with Vector Store & Streaming API"
      : "Modern Full-Stack Jamstack Architecture",
    layers,
    whyRepoMap: {},
    isAiPowered: false,
  };
}

/* ------------------------------------------------------------------ */
/* 2. "Why this repo?" Insights                                       */
/* ------------------------------------------------------------------ */

export async function generateRepoInsights(
  userQuery: string,
  repos: { full_name: string; name: string; description: string | null; language: string | null; stargazers_count: number }[]
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  if (!repos.length) return map;

  const groq = getGroqClient();
  if (groq) {
    try {
      const topRepos = repos.slice(0, 8);
      const repoSummaries = topRepos.map(
        (r) =>
          `ID: "${r.full_name}" | Name: "${r.name}" | Lang: ${r.language ?? "N/A"} | Desc: "${r.description ?? "N/A"}"`
      ).join("\n");

      const model = await getBestModel(groq);
      const response = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `You are an expert developer evaluating GitHub repos for a user's project: "${userQuery}".
For each repository, write a sharp, punchy 1-sentence insight (under 18 words) explaining WHY this specific repo is helpful for this project idea.
Format strictly as JSON with key as the repo full_name and value as the 1-sentence string insight.
Example: { "owner/repo": "Provides clean Fabric.js canvas bindings with touch support and prebuilt whiteboard tools." }`,
          },
          {
            role: "user",
            content: `Evaluate these repositories for the project "${userQuery}":\n${repoSummaries}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_completion_tokens: 600,
      });

      const raw = response.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as Record<string, string>;
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string") map[k] = v;
      }
      return map;
    } catch (err) {
      console.warn("Groq repo insight generation failed, using heuristic insights:", err);
    }
  }

  // Heuristic Insights fallback
  for (const r of repos) {
    const lang = r.language ? ` in ${r.language}` : "";
    const stars = r.stargazers_count > 5000 ? "Highly-starred industry standard" : "Community-tested open-source starter";
    if (r.description && r.description.length > 10) {
      map[r.full_name] = `${stars}${lang} featuring ${r.description.slice(0, 90).trim()}…`;
    } else {
      map[r.full_name] = `${stars}${lang} ready to jumpstart your development stack.`;
    }
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* 3. Starter Blueprint Generator                                     */
/* ------------------------------------------------------------------ */

export async function generateProjectBlueprint(
  userQuery: string,
  selectedRepos: { full_name: string; description: string; language: string }[]
): Promise<Blueprint> {
  const groq = getGroqClient();

  if (groq) {
    try {
      const repoDetails = selectedRepos
        .map((r) => `- ${r.full_name} (${r.language}): ${r.description}`)
        .join("\n");

      const model = await getBestModel(groq);
      const response = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `You are a master software architect and technical lead.
Create a step-by-step implementation blueprint explaining how to build the user's project idea using the recommended/selected open-source repositories.
The roadmap must have 3 to 4 sequential, practical steps (e.g. Scaffolding, Core Logic/Sync, Integration, Deployment).
For at least 1-2 steps, provide a concise real code snippet or CLI command.

Respond strictly with a JSON object:
{
  "projectTitle": "Catchy Project Title",
  "overview": "2-3 sentences explaining the architecture and data flow",
  "steps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "Clear technical instructions on what to implement",
      "stackComponent": "e.g. Frontend / Next.js",
      "sampleCode": "Optional short typescript or shell snippet"
    }
  ],
  "keyChallenges": ["Pitfall 1 with solution", "Pitfall 2 with solution"],
  "recommendedRepos": [
    { "name": "owner/repo", "role": "e.g. UI Layer", "url": "https://github.com/owner/repo" }
  ]
}`,
          },
          {
            role: "user",
            content: `Project Idea: "${userQuery}"\nRepositories to build with:\n${repoDetails || "Find standard open-source stack"}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_completion_tokens: 1500,
      });

      const raw = response.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as Blueprint;
      if (parsed.steps && parsed.steps.length > 0) {
        return {
          ...parsed,
          isAiPowered: true,
        };
      }
    } catch (err) {
      console.warn("Groq blueprint generation failed, using fallback:", err);
    }
  }

  // Fallback blueprint
  const repos = selectedRepos.length > 0
    ? selectedRepos
    : [{ full_name: "recommended-starter/stack", description: "Starter template", language: "TypeScript" }];

  return {
    projectTitle: `Implementation Blueprint: ${userQuery}`,
    overview: `This architectural blueprint guides you through building "${userQuery}" step-by-step by combining curated open-source components with clean separation of concerns.`,
    steps: [
      {
        step: 1,
        title: "Repository Setup & Scaffolding",
        description: `Clone the primary core repository (${repos[0]?.full_name || "starter"}) or initialize your frontend application. Set up environment variables and package dependencies.`,
        stackComponent: "Foundation & Frontend",
        sampleCode: `git clone https://github.com/${repos[0]?.full_name || "owner/repo"}.git\ncd my-project\nnpm install`,
      },
      {
        step: 2,
        title: "Core Service & State Management Integration",
        description: "Connect the data store or communication channels. Implement your core logic, event handlers, and data contracts between client and server.",
        stackComponent: "Business Logic & State",
        sampleCode: `// Example event pipeline\nexport async function handleAction(payload: unknown) {\n  const result = await processPayload(payload);\n  return { success: true, data: result };\n}`,
      },
      {
        step: 3,
        title: "Authentication & Database Persistence",
        description: "Configure user authentication (Auth.js / Supabase) and persist schemas in PostgreSQL or SQLite with Prisma or Drizzle ORM.",
        stackComponent: "Database & Security",
        sampleCode: `// Schema configuration\nconst db = await connectDatabase(process.env.DATABASE_URL);\nawait db.sync();`,
      },
      {
        step: 4,
        title: "Testing, Containerization & Production Deployment",
        description: "Configure continuous integration (GitHub Actions), Docker containers, and deploy to Vercel, Railway, or Docker Swarm.",
        stackComponent: "CI/CD & DevOps",
        sampleCode: `npm run test\nnpm run build\nnpm start`,
      },
    ],
    keyChallenges: [
      "Rate limits & network latency: Use server-side caching (Redis or Next.js fetch cache) for external API calls.",
      "State synchronization: Keep frontend state decoupled from heavy database queries using optimistic UI updates.",
    ],
    recommendedRepos: repos.map((r) => ({
      name: r.full_name,
      role: r.language ? `${r.language} Core Engine` : "Application Component",
      url: `https://github.com/${r.full_name}`,
    })),
    isAiPowered: false,
  };
}
