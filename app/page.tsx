import { classifyDomain, getRepos, getUser } from "@/lib/github";
import {
  awards,
  initiatives,
  ossContributions,
  projectDetails,
  projectLiveUrls,
  projectVisuals,
  publications,
  PINNED_REPOS,
} from "@/lib/content";
import TitleBar from "@/components/TitleBar";
import Hero from "@/components/Hero";
import Awards from "@/components/Awards";
import Publications from "@/components/Publications";
import ProjectsSection, { type ProjectEntry } from "@/components/ProjectsSection";
import Initiatives from "@/components/Initiatives";
import OSSContributions from "@/components/OSSContributions";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import TraceBridge from "@/components/TraceBridge";
import ScrollRail from "@/components/ScrollRail";
import ScrollBall from "@/components/ScrollBall";
import Navigator from "@/components/Navigator";

const FALLBACK_NAME = "Yaphet Lemiesa";
const FALLBACK_BIO = "Student interested in software, hardware, AI, and robotics.";
const FALLBACK_URL = "https://github.com/ylemiesa57";

const LINKEDIN_URL = "https://www.linkedin.com/in/yaphet-lemiesa-606603287/";
const CONTACT_EMAIL = "yaphkl75@mit.edu";

/** Rendered server-side so the string is identical at hydration. */
function formatPushed(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return "pushed today";
  if (days === 1) return "pushed yesterday";
  if (days < 30) return `pushed ${days}d ago`;
  return `pushed ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

export default async function Home() {
  const [user, repos] = await Promise.all([getUser(), getRepos()]);

  const pinnedSet = new Set(PINNED_REPOS);
  const entries: ProjectEntry[] = repos.map((repo) => ({
    repo,
    domain: classifyDomain(repo),
    pinned: pinnedSet.has(repo.name),
    detail: projectDetails[repo.name],
    visual: projectVisuals[repo.name],
    liveUrl: projectLiveUrls[repo.name],
    pushedLabel: formatPushed(repo.pushed_at),
  }));

  // Pinned first, then the rest in the order getRepos() ranked them.
  entries.sort((a, b) => Number(b.pinned) - Number(a.pinned));

  const rev = new Date().toISOString().slice(0, 10).replace(/-/g, ".");

  return (
    <div id="page-root">
      <ScrollRail />
      <ScrollBall />
      <TitleBar sheet="01/01" rev={rev} drawnBy={(user?.login ?? "ylemiesa57").toUpperCase()} />
      <Reveal id="hero">
        <Hero
          name={user?.name ?? FALLBACK_NAME}
          tagline={user?.bio?.split("\n")[0] || FALLBACK_BIO}
          projectCount={repos.length}
          publicationCount={publications.length}
          ossCount={ossContributions.length}
          photoSrc="/photo.jpg"
        />
      </Reveal>
      <TraceBridge />
      <Reveal id="modules">
        <ProjectsSection entries={entries} />
      </Reveal>
      <Reveal id="awards">
        <Awards items={awards} />
      </Reveal>
      <Reveal id="publications">
        <Publications items={publications} />
      </Reveal>
      <Reveal id="oss">
        <OSSContributions items={ossContributions} />
      </Reveal>
      <Reveal id="initiatives">
        <Initiatives items={initiatives} />
      </Reveal>
      <Reveal id="contact">
        <Footer
          githubUrl={user?.html_url ?? FALLBACK_URL}
          email={CONTACT_EMAIL}
          linkedinUrl={LINKEDIN_URL || undefined}
        />
      </Reveal>
      <Navigator />
    </div>
  );
}
