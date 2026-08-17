// Thin server-side client for the public GitHub REST API. No token is
// required for public data; if GITHUB_TOKEN is set in the environment,
// it's used to raise the (otherwise low, unauthenticated) rate limit.

const USERNAME = process.env.GITHUB_USERNAME || "ylemiesa57";
const API = "https://api.github.com";

// Revalidate hourly: fresh enough to reflect new repos/stars without
// hammering the API on every request.
const REVALIDATE_SECONDS = 60 * 60;

function authHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export interface GithubUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  followers: number;
  public_repos: number;
  location: string | null;
  blog: string | null;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  topics: string[];
}

async function safeFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: authHeaders(),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      // Log loudly rather than failing silently. The usual cause in
      // production is a missing GITHUB_TOKEN: unauthenticated calls are
      // limited to 60/hour *per IP*, and serverless egress IPs are shared,
      // so that budget is often already spent by someone else. The symptom
      // is a page that renders fine but with an empty Projects section,
      // which is otherwise very hard to diagnose from the outside.
      console.error(
        `[github] GET ${path} failed: ${res.status} ${res.statusText}` +
          (res.status === 403 || res.status === 429
            ? ` (rate limited; remaining=${res.headers.get("x-ratelimit-remaining") ?? "?"}` +
              `, authenticated=${process.env.GITHUB_TOKEN ? "yes" : "NO -- set GITHUB_TOKEN"})`
            : "")
      );
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[github] GET ${path} threw:`, err);
    return null;
  }
}

export async function getUser(): Promise<GithubUser | null> {
  return safeFetch<GithubUser>(`/users/${USERNAME}`);
}

// Weights stars highest, forks next, watchers last -- all three are genuine
// external signal, vs. pushed_at which just says "recently touched." Ties
// (common: most repos here have 0 of all three right now) fall back to
// most recently pushed.
export function popularityScore(repo: GithubRepo): number {
  return repo.stargazers_count * 3 + repo.forks_count * 2 + repo.watchers_count;
}

export async function getRepos(): Promise<GithubRepo[]> {
  const repos = await safeFetch<GithubRepo[]>(
    `/users/${USERNAME}/repos?per_page=100&type=owner&sort=pushed`
  );
  if (!repos) return [];
  return repos
    .filter((r) => !r.fork && !r.archived)
    .sort((a, b) => {
      const scoreDiff = popularityScore(b) - popularityScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
    });
}

/**
 * Fetch a repo's README as raw markdown, for the Projects section's
 * README-derived copy (see lib/readme.ts). Uses the `.raw` media type so we
 * get markdown rather than base64 JSON. Returns null on any failure, matching
 * safeFetch's degrade-quietly-but-log contract.
 *
 * Note this is one extra request per repo at build/revalidate time, which
 * makes an authenticated GITHUB_TOKEN effectively required: unauthenticated
 * callers get 60 requests/hour per IP and this alone would exhaust it.
 */
export async function getReadme(repoName: string): Promise<string | null> {
  try {
    const res = await fetch(`${API}/repos/${USERNAME}/${repoName}/readme`, {
      headers: { ...authHeaders(), Accept: "application/vnd.github.raw" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      if (res.status !== 404) {
        console.error(`[github] README ${repoName} failed: ${res.status} ${res.statusText}`);
      }
      return null;
    }
    return await res.text();
  } catch (err) {
    console.error(`[github] README ${repoName} threw:`, err);
    return null;
  }
}

// Buckets a repo's language/topics into one of Kiya's real domain areas, so
// the hero's circuit-trace nodes and the "DOMAIN" tag on each module card
// reflect actual categories of her work rather than raw GitHub language
// strings.
export type Domain = "hardware" | "ai_ml" | "systems" | "data";

const DOMAIN_KEYWORDS: Record<Domain, string[]> = {
  hardware: ["riscv", "risc-v", "fpga", "verilog", "bluespec", "hardware", "vlsi", "chip", "simd", "isaac", "robot", "drone"],
  ai_ml: ["ai", "ml", "bayes", "bayesian", "nlp", "llm", "rag", "model", "distilbert", "embrace", "agent", "vision"],
  systems: ["kafka", "spark", "pipeline", "distributed", "cluster", "kubernetes", "docker", "infra", "scraper", "backend"],
  data: ["finance", "analysis", "screener", "fundamentals", "bom", "data"],
};

export function classifyDomain(repo: GithubRepo): Domain {
  const haystack = `${repo.name} ${repo.description ?? ""} ${repo.language ?? ""} ${repo.topics.join(" ")}`.toLowerCase();
  for (const domain of ["hardware", "ai_ml", "systems", "data"] as Domain[]) {
    if (DOMAIN_KEYWORDS[domain].some((kw) => haystack.includes(kw))) {
      return domain;
    }
  }
  return "systems";
}

export const DOMAIN_LABEL: Record<Domain, string> = {
  hardware: "HARDWARE",
  ai_ml: "AI / ML",
  systems: "SYSTEMS",
  data: "DATA",
};
