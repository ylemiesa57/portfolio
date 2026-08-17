import { classifyDomain, GithubRepo } from "@/lib/github";
import { PINNED_REPOS } from "@/lib/content";
import ProjectCard from "./ProjectCard";
import RepoCarousel from "./RepoCarousel";
import styles from "./RepoGrid.module.css";

const FEATURED_COUNT = 6;

const GITHUB_PROFILE = "https://github.com/ylemiesa57";

export default function RepoGrid({ repos }: { repos: GithubRepo[] }) {
  // The GitHub API call can fail at build/revalidate time (most often an
  // unauthenticated rate-limit -- see lib/github.ts). Previously that rendered
  // the full section furniture around nothing: a "0 loaded" counter and copy
  // inviting you to "spin the carousel" and "hover the center card" when there
  // was no carousel and no cards. Say what actually happened instead, and give
  // people somewhere to go.
  if (repos.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>selected</p>
            <h2 className={styles.title}>Projects</h2>
          </div>
        </div>
        <p className={styles.sub}>
          Couldn&apos;t reach the GitHub API just now, so this section is
          empty — it&apos;s built live from GitHub rather than hard-coded.{" "}
          <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer">
            Browse the repositories directly ↗
          </a>
        </p>
      </section>
    );
  }

  const pinnedSet = new Set(PINNED_REPOS);
  const pinned = repos.filter((r) => pinnedSet.has(r.name));
  const unpinned = repos.filter((r) => !pinnedSet.has(r.name));

  const featured = [...pinned, ...unpinned].slice(0, FEATURED_COUNT);
  const featuredIds = new Set(featured.map((r) => r.id));
  const rest = repos.filter((r) => !featuredIds.has(r.id));

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>selected</p>
          <h2 className={styles.title}>Projects</h2>
        </div>
        <span className={styles.count}>{repos.length} loaded</span>
      </div>
      <p className={styles.sub}>
        Three builds on a slight arc — spin the carousel, hover the center
        card to tilt, click to open the repo. Ranked by traction, with a few
        pinned by hand.
      </p>

      <RepoCarousel repos={featured} pinned={pinnedSet} />

      {rest.length > 0 && (
        <details className={styles.more}>
          <summary className={styles.moreSummary}>
            Show {rest.length} more project{rest.length === 1 ? "" : "s"}
          </summary>
          <div className={`${styles.grid} ${styles.moreGrid}`}>
            {rest.map((repo) => (
              <ProjectCard
                key={repo.id}
                repo={repo}
                pinned={false}
                domain={classifyDomain(repo)}
              />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
