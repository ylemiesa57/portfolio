import {
  classifyDomain,
  DOMAIN_LABEL,
  Domain,
  getRepos,
  getUser,
} from "@/lib/github";
import { awards, initiatives, publications } from "@/lib/content";
import TitleBar from "@/components/TitleBar";
import Hero from "@/components/Hero";
import Awards from "@/components/Awards";
import Publications from "@/components/Publications";
import RepoGrid from "@/components/RepoGrid";
import Initiatives from "@/components/Initiatives";
import Footer from "@/components/Footer";
import { TraceNode } from "@/components/CircuitTrace";

const FALLBACK_NAME = "Yaphet Lemiesa";
const FALLBACK_BIO = "Student interested in hardware, AI, and robotics.";
const FALLBACK_URL = "https://github.com/ylemiesa57";

// TODO: set the real LinkedIn URL once provided -- left blank so the
// footer link doesn't render a wrong/placeholder address in the meantime.
const LINKEDIN_URL = "";
const CONTACT_EMAIL = "yaphkl75@mit.edu";

export default async function Home() {
  const [user, repos] = await Promise.all([getUser(), getRepos()]);

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
      <Awards items={awards} />
      <Publications items={publications} />
      <RepoGrid repos={repos} />
      <Initiatives items={initiatives} />
      <Footer
        githubUrl={user?.html_url ?? FALLBACK_URL}
        email={CONTACT_EMAIL}
        linkedinUrl={LINKEDIN_URL || undefined}
      />
    </div>
  );
}
