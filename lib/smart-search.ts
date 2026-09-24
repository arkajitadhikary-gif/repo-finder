/**
 * Smart Mode engine — turns a free-form project description into
 * high-quality GitHub search queries, then ranks the merged results.
 *
 * Example input:
 *   "ami ekta todo app banate chai react diye, dark mode soho"
 *
 * Output: several GitHub queries + extracted keywords + detected language.
 */

import type { GitHubRepo } from "./github";

/* ------------------------------------------------------------------ */
/* Dictionaries                                                        */
/* ------------------------------------------------------------------ */

/** Words that carry no search signal (English + common Banglish fillers). */
const STOPWORDS = new Set([
  // English fillers
  "a", "an", "the", "i", "me", "my", "we", "our", "you", "your",
  "want", "wants", "need", "needs", "make", "makes", "making", "build",
  "building", "built", "create", "creating", "created", "develop",
  "developing", "project", "app", "apps", "application", "applications",
  "website", "web", "site", "software", "system", "tool", "tools",
  "with", "using", "use", "used", "for", "and", "or", "but", "so",
  "that", "this", "these", "those", "it", "its", "is", "are", "was",
  "were", "be", "been", "am", "do", "does", "did", "have", "has",
  "had", "will", "would", "can", "could", "should", "shall", "may",
  "might", "must", "please", "like", "similar", "something", "some",
  "any", "all", "of", "in", "on", "at", "to", "from", "by", "about",
  "which", "who", "whom", "what", "where", "when", "how", "there",
  "here", "one", "two", "very", "really", "just", "also", "then",
  "than", "them", "they", "their", "if", "not", "no", "yes", "nice",
  "good", "best", "new", "modern", "beautiful", "cool", "simple",
  "easy", "proper", "professional", "premium", "kind", "type",
  // Banglish / romanized-Bengali fillers
  "ami", "amr", "amar", "tumi", "tomar", "apni", "tar", "tarar",
  "eta", "oita", "jeta", "je", "jemon", "rokom", "jekono", "kono",
  "bhabe", "bhave", "kore", "korbo", "korte", "chai", "chachi",
  "chaichi", "chahbe", "lagbe", "lage", "lagto", "hoy", "hoye",
  "holo", "hoyeche", "hoyechhe", "ache", "chilo", "silo", "thake",
  "thakbe", "thakbo", "kor", "koro", "korechi", "banabo", "banate",
  "banaben", "banle", "bananor", "kivabe", "keno", "kothay", "kokhon",
  "jekhane", "jokhon", "jeno", "jate", "mane", "matlab", "ar", "o",
  "ki", "kichu", "kichui", "onek", "aro", "beshi", "kom", "ektu",
  "khub", "ekta", "akta", "duita", "soho", "sohoi", "diye", "die",
  "diyei", "mile", "ebong", "othoba", "ba", "tarpor", "atarpor",
  "age", "pore", "ekhon", "ajke", "kalke", "amake", "amay",
]);

/** Multi-word phrases collapsed into a single search token. */
const PHRASES: Record<string, string> = {
  "social media": "social-media",
  "social network": "social-network",
  "machine learning": "machine-learning",
  "deep learning": "deep-learning",
  "neural network": "neural-network",
  "real time": "realtime",
  "real-time": "realtime",
  "e commerce": "ecommerce",
  "online shop": "ecommerce",
  "online store": "ecommerce",
  "job portal": "job-portal",
  "food delivery": "food-delivery",
  "ride sharing": "ride-sharing",
  "video streaming": "video-streaming",
  "code editor": "code-editor",
  "note taking": "notes-app",
  "notes app": "notes-app",
};

/** Domain keyword → richer GitHub vocabulary. */
const SYNONYMS: Record<string, string[]> = {
  ecommerce: ["ecommerce", "shop", "store", "commerce"],
  shop: ["ecommerce", "shop"],
  store: ["ecommerce", "store"],
  chat: ["chat", "chat-application", "realtime-chat", "messenger"],
  chatbot: ["chatbot", "ai-chatbot", "conversational-ai"],
  todo: ["todo", "todo-app", "task-manager", "todo-list"],
  task: ["task-manager", "todo-app"],
  weather: ["weather", "weather-app", "forecast"],
  blog: ["blog", "blog-engine", "cms"],
  portfolio: ["portfolio", "personal-website", "portfolio-website"],
  movie: ["movie", "movie-app", "movies"],
  music: ["music", "music-player", "spotify-clone"],
  video: ["video", "video-player", "youtube-clone"],
  youtube: ["youtube-clone", "youtube"],
  netflix: ["netflix-clone", "streaming"],
  spotify: ["spotify-clone", "music-player"],
  clone: ["clone"],
  dashboard: ["dashboard", "admin-dashboard", "analytics-dashboard"],
  game: ["game", "games", "game-engine"],
  calculator: ["calculator"],
  calendar: ["calendar", "calendar-app"],
  email: ["email-client", "mail"],
  notes: ["notes-app", "note-taking"],
  password: ["password-manager", "password-generator"],
  expense: ["expense-tracker", "budget-tracker", "finance"],
  finance: ["finance", "finance-tracker", "fintech"],
  banking: ["banking", "digital-bank", "fintech"],
  booking: ["booking-system", "reservation"],
  hotel: ["hotel-booking", "booking-system"],
  library: ["library-management", "library-system"],
  school: ["school-management", "education"],
  hospital: ["hospital-management", "healthcare"],
  healthcare: ["healthcare", "medical"],
  fitness: ["fitness", "workout", "fitness-tracker"],
  recipe: ["recipe", "recipes", "food"],
  news: ["news", "news-app", "news-feed"],
  travel: ["travel", "travel-app", "tourism"],
  map: ["maps", "maps-clone", "geolocation"],
  camera: ["camera", "photo-editor"],
  editor: ["editor", "code-editor", "text-editor"],
  resume: ["resume-builder", "cv-builder"],
  quiz: ["quiz", "quiz-app", "trivia"],
  learning: ["e-learning", "learning-management", "lms", "education"],
  job: ["job-portal", "job-board"],
  crypto: ["crypto", "cryptocurrency", "blockchain"],
  blockchain: ["blockchain", "web3"],
  automation: ["automation", "bot", "automation-scripts"],
  scraper: ["web-scraper", "scraper", "scraping", "crawler"],
  chatgpt: ["chatgpt", "openai", "ai-assistant"],
  ai: ["ai", "artificial-intelligence", "machine-learning"],
};

/** Tech words → GitHub language qualifier for better matches. */
const LANGUAGE_HINTS: Record<string, string> = {
  react: "JavaScript",
  reactjs: "JavaScript",
  next: "JavaScript",
  nextjs: "JavaScript",
  "next.js": "JavaScript",
  vue: "JavaScript",
  vuejs: "JavaScript",
  svelte: "JavaScript",
  angular: "JavaScript",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  python: "Python",
  django: "Python",
  flask: "Python",
  fastapi: "Python",
  java: "Java",
  spring: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  swiftui: "Swift",
  flutter: "Dart",
  dart: "Dart",
  rust: "Rust",
  go: "Go",
  golang: "Go",
  php: "PHP",
  laravel: "PHP",
  c: "C",
  "c++": "C++",
  cpp: "C++",
  "c#": "C#",
  csharp: "C#",
  dotnet: "C#",
  ruby: "Ruby",
  rails: "Ruby",
};

/* ------------------------------------------------------------------ */
/* Extraction                                                          */
/* ------------------------------------------------------------------ */

export interface SmartPlan {
  /** GitHub search queries to run (they are merged + de-duplicated). */
  queries: string[];
  /** Primary keywords extracted from the plan. */
  keywords: string[];
  /** GitHub language qualifier if the plan clearly implies one. */
  language: string | null;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRawTokens(text: string): string[] {
  return text
    .split(" ")
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((t) => t.length > 1 || t === "c" || t === "ai");
}

export function buildSmartPlan(plan: string): SmartPlan {
  let text = normalize(plan);

  // Collapse known multi-word phrases first ("social media" → "social-media").
  for (const [phrase, token] of Object.entries(PHRASES)) {
    if (text.includes(phrase)) {
      text = text.split(phrase).join(` ${token} `);
    }
  }

  const raw = extractRawTokens(text);

  // Detected language (first tech word that maps to a language wins).
  let language: string | null = null;
  for (const token of raw) {
    if (token in LANGUAGE_HINTS && !language) {
      language = LANGUAGE_HINTS[token];
    }
  }

  // Keyword extraction: drop stopwords, expand synonyms.
  const keywords: string[] = [];
  const seen = new Set<string>();
  const push = (word: string) => {
    const w = word.toLowerCase();
    if (w && !seen.has(w) && !STOPWORDS.has(w) && w.length > 1) {
      seen.add(w);
      keywords.push(w);
    }
  };

  for (const token of raw) {
    if (STOPWORDS.has(token)) continue;
    if (token in LANGUAGE_HINTS) continue; // language hints are not content keywords
    if (token in SYNONYMS) {
      for (const syn of SYNONYMS[token]) push(syn);
    } else {
      push(token);
    }
  }

  const top = keywords.slice(0, 6);
  const primary = top[0] ?? normalize(plan).split(" ")[0];

  /*
   * GitHub search treats spaces as AND, so each query stays deliberately
   * short (1-2 terms). Broader coverage comes from running several
   * angles in parallel plus the fallback chain in the API route.
   */
  const queries: string[] = [];
  const langQ = language ? ` language:${language}` : "";

  if (top.length > 0) {
    // Angle 1: the two strongest content keywords together.
    queries.push(
      `${top.slice(0, 2).join(" ")} in:name,description,topics${langQ}`
    );
    // Angle 2: curated "awesome-*" lists — community best-of collections.
    queries.push(`awesome ${primary}${langQ}`);
    // Angle 3: ready-made templates / starters.
    queries.push(`${primary} template in:name,description,topics`);
  } else {
    // Fallback: nothing useful extracted — search the raw text.
    queries.push(`${normalize(plan)} in:name,description${langQ}`);
  }

  return { queries, keywords: top, language };
}

/* ------------------------------------------------------------------ */
/* Ranking                                                             */
/* ------------------------------------------------------------------ */

function relevanceScore(repo: GitHubRepo, keywords: string[]): number {
  const haystack = `${repo.full_name} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`.toLowerCase();
  if (keywords.length === 0) return 0.4;
  let hits = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw)) hits++;
  }
  return hits / keywords.length;
}

function recencyScore(pushedAt: string): number {
  const months = (Date.now() - new Date(pushedAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (months < 3) return 1;
  if (months < 6) return 0.85;
  if (months < 12) return 0.65;
  if (months < 24) return 0.4;
  return 0.15;
}

/**
 * Score a repository 0–100:
 *   45% popularity (log-scaled stars)
 *   35% keyword relevance (name/description/topics)
 *   20% maintenance recency (last push)
 */
export function scoreRepo(repo: GitHubRepo, keywords: string[]): number {
  const starScore = Math.min(1, Math.log10(repo.stargazers_count + 1) / 5.5);
  const rel = relevanceScore(repo, keywords);
  const rec = recencyScore(repo.pushed_at);
  return Math.round((0.45 * starScore + 0.35 * rel + 0.2 * rec) * 100);
}

export function mergeAndRank(
  batches: GitHubRepo[][],
  keywords: string[]
): Array<GitHubRepo & { score: number }> {
  const byId = new Map<number, GitHubRepo>();
  for (const batch of batches) {
    for (const repo of batch) {
      if (!repo || repo.archived) continue;
      byId.set(repo.id, repo);
    }
  }
  return [...byId.values()]
    .map((repo) => ({ ...repo, score: scoreRepo(repo, keywords) }))
    .sort((a, b) => b.score - a.score || b.stargazers_count - a.stargazers_count);
}
