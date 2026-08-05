import { classifyDomain, GithubRepo } from "@/lib/github";
import { PINNED_REPOS } from "@/lib/content";
import ProjectCard from "./ProjectCard";
import styles from "./RepoGrid.module.css";

const FEATURED_COUNT = 6;

export default function RepoGrid({ repos }: { repos: GithubRepo[] }) {
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
          <h2 className={styles.title}>Modules</h2>
        </div>
        <span className={styles.count}>{repos.length} loaded</span>
      </div>
      <p className={styles.sub}>
        Little animated glyphs for each build — hover to tilt, click to open
        the repo. Ranked by traction, with a few pinned by hand.
      </p>

      <div className={styles.grid}>
        {featured.map((repo) => (
          <ProjectCard
            key={repo.id}
            repo={repo}
            pinned={pinnedSet.has(repo.name)}
            domain={classifyDomain(repo)}
          />
        ))}
      </div>

      {rest.length > 0 && (
        <details className={styles.more}>
          <summary className={styles.moreSummary}>
            Show {rest.length} more module{rest.length === 1 ? "" : "s"}
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
