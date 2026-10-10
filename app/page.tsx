import { existsSync } from "node:fs";
import { join } from "node:path";
import { classifyDomain, getRepos, getUser, type Domain } from "@/lib/github";
import {
  awards,
  contactChannels,
  education,
  experience,
  initiatives,
  ossContributions,
  projectDetails,
  projectLiveUrls,
  publications,
  researchStatement,
  researchThreads,
  PINNED_REPOS,
  SCHOLAR_URL,
} from "@/lib/content";
import { slug } from "@/lib/graph-build";
import Site, { type Entry, type SiteData } from "@/components/site/Site";

const FALLBACK_NAME = "Yaphet Lemiesa";
const FALLBACK_URL = "https://github.com/ylemiesa57";

const HERO_STATEMENT =
  "I research and build AI systems under real constraints: small and noisy data, bounded memory, production stakes.";

// The author's own line, carried over from the previous site unchanged.
const AUTHOR_NOTE = "MIT, NASA, & Bloomberg work stays private... Ask and I will walk you through it! :)";

const DOMAIN_NAME: Record<Domain, string> = {
  hardware: "Hardware",
  ai_ml: "AI / ML",
  systems: "Systems",
  data: "Data",
};

const ORG_SHORT: [RegExp, string][] = [
  [/bloomberg/i, "Bloomberg"],
  [/jet propulsion/i, "NASA JPL"],
  [/zenyai/i, "Zenyai"],
  [/cams|sloan/i, "MIT Sloan CAMS"],
];
function shortOrg(org: string): string {
  for (const [re, s] of ORG_SHORT) if (re.test(org)) return s;
  return org;
}

/** Rendered server-side so the string is identical at hydration. */
function formatPushed(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return "pushed today";
  if (days === 1) return "pushed yesterday";
  if (days < 30) return `pushed ${days} days ago`;
  return `pushed ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

const year = (label: string) => label.match(/\d{4}/)?.[0] ?? label;

export default async function Home() {
  const [user, repos] = await Promise.all([getUser(), getRepos()]);
  const name = user?.name ?? FALLBACK_NAME;
  const githubUrl = user?.html_url ?? FALLBACK_URL;
  const resumeUrl = existsSync(join(process.cwd(), "public", "resume.pdf")) ? "/resume.pdf" : null;

  const current = experience.filter((e) => e.end === "Present");
  const past = experience.filter((e) => e.end !== "Present");
  const edu = education[0];

  // The featured projects, in the curated order. GitHub supplies what is live
  // about each (language, last push); the write-up comes from lib/content.ts,
  // so the list still stands when GitHub doesn't answer.
  const repoByName = new Map(repos.map((r) => [r.name, r]));
  const projects: Entry[] = PINNED_REPOS.filter((n) => repoByName.has(n) || projectDetails[n]).map((n) => {
    const repo = repoByName.get(n);
    const detail = projectDetails[n];
    const url = repo?.html_url ?? `${githubUrl}/${n}`;
    return {
      slug: n,
      name: n,
      aside: repo ? DOMAIN_NAME[classifyDomain(repo)] : undefined,
      meta: repo ? [repo.language, formatPushed(repo.pushed_at)].filter(Boolean).join(" · ") : undefined,
      paragraphs: detail
        ? [detail.what, detail.why].filter((p): p is string => Boolean(p))
        : [repo?.description ?? "No description on GitHub yet. The repository is the record."],
      links: [
        { label: "Repository", url },
        ...(projectLiveUrls[n] ? [{ label: "Live site", url: projectLiveUrls[n] }] : []),
      ],
    };
  });

  const data: SiteData = {
    name,
    statement: HERO_STATEMENT,
    facts: [
      {
        label: "Now",
        // The research position leads; the page presents the researcher first.
        lines: [...current]
          .sort((a, b) => Number(/research/i.test(b.role)) - Number(/research/i.test(a.role)))
          .map((e) => `${e.role}, ${shortOrg(e.org)}`),
      },
      { label: "Before", lines: [past.map((e) => shortOrg(e.org)).join(" · ")] },
      { label: "Degree", lines: [`MIT EECS · ${edu.end.replace(", ", " · ")}`] },
    ],
    note: AUTHOR_NOTE,
    links: [
      ...contactChannels.map((c) => ({ label: c.label, url: c.url })),
      ...(resumeUrl ? [{ label: "Résumé", url: resumeUrl }] : []),
    ],
    portrait: "/photo.jpg",
    research: {
      statement: researchStatement,
      threads: researchThreads.map((t) => ({
        slug: t.slug,
        name: t.name,
        meta: t.setting,
        paragraphs: [t.summary],
        links: [],
      })),
    },
    publications: [...publications]
      .sort((a, b) => (b.citedBy ?? 0) - (a.citedBy ?? 0) || b.year - a.year)
      .map((p) => ({
        title: p.title,
        authors: p.authors,
        venue: `${p.venue}, ${p.year}`,
        cited: p.citedBy ? `cited by ${p.citedBy}` : undefined,
        url: p.url,
      })),
    // Keyed like their knowledge-graph nodes, so a cited honor opens here.
    honors: awards.map((a) => ({
      slug: slug(a.title),
      name: a.title,
      aside: a.year,
      meta: a.year,
      paragraphs: [a.detail],
      links: a.url ? [{ label: "Source", url: a.url }] : [],
    })),
    scholarUrl: SCHOLAR_URL,
    projects,
    openSource: ossContributions.map((c) => ({
      slug: c.repo,
      name: c.repo,
      paragraphs: [c.description],
      links: [{ label: c.url.includes("/pull/") ? "Pull request" : "Pull requests", url: c.url }],
    })),
    githubUrl,
    githubOk: repos.length > 0,
    experience: [...experience]
      .sort((a, b) => Number(b.end === "Present") - Number(a.end === "Present") || Number(year(b.start)) - Number(year(a.start)))
      .map((e) => ({
        slug: e.slug,
        name: `${e.role}, ${shortOrg(e.org)}`,
        aside: e.end === "Present" ? `${year(e.start)} to now` : year(e.start),
        meta: `${e.org} · ${e.location} · ${e.start} – ${e.end}`,
        paragraphs: e.bullets,
        links: [],
      })),
    education: `${edu.degree}, ${edu.school}. ${edu.end}.`,
    community: initiatives.map((i) => ({
      slug: i.slug,
      name: i.name,
      meta: i.role,
      paragraphs: i.body,
      links: [{ label: `Visit ${i.name}`, url: i.url }],
    })),
  };

  return <Site data={data} />;
}
