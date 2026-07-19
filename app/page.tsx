import {
  classifyDomain,
  DOMAIN_LABEL,
  Domain,
  getRecentEvents,
  getRepos,
  getUser,
} from "@/lib/github";
import TitleBar from "@/components/TitleBar";
import Hero from "@/components/Hero";
import RepoGrid from "@/components/RepoGrid";
import ActivitySignal from "@/components/ActivitySignal";
import Footer from "@/components/Footer";
import { TraceNode } from "@/components/CircuitTrace";

const FALLBACK_NAME = "Yaphet Lemiesa";
const FALLBACK_BIO = "Student interested in hardware, AI, and robotics.";
const FALLBACK_URL = "https://github.com/ylemiesa57";

export default async function Home() {
  const [user, repos, events] = await Promise.all([
    getUser(),
    getRepos(),
    getRecentEvents(),
  ]);

  const domainCounts = repos.reduce<Record<Domain, number>>(
    (acc, repo) => {
      const domain = classifyDomain(repo);
      acc[domain] = (acc[domain] ?? 0) + 1;
      return acc;
    },
    { hardware: 0, ai_ml: 0, systems: 0, data: 0 }
  );

  const domains: TraceNode[] = (
    Object.entries(domainCounts) as [Domain, number][]
  )
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([domain, count]) => ({ label: DOMAIN_LABEL[domain], count }));

  const languageCount = new Set(
    repos.map((r) => r.language).filter((l): l is string => Boolean(l))
  ).size;

  const rev = new Date().toISOString().slice(0, 10).replace(/-/g, ".");

  return (
    <div id="page-root">
      <TitleBar sheet="01/01" rev={rev} drawnBy={(user?.login ?? "ylemiesa57").toUpperCase()} />
      <Hero
        name={user?.name ?? FALLBACK_NAME}
        tagline={user?.bio?.split("\n")[0] || FALLBACK_BIO}
        repoCount={user?.public_repos ?? repos.length}
        languageCount={languageCount}
        domains={domains}
      />
      <RepoGrid repos={repos} />
      <ActivitySignal events={events} />
      <Footer githubUrl={user?.html_url ?? FALLBACK_URL} />
    </div>
  );
}
