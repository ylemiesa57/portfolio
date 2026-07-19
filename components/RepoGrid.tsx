import { DOMAIN_LABEL, GithubRepo, classifyDomain } from "@/lib/github";
import { PINNED_REPOS } from "@/lib/content";
import styles from "./RepoGrid.module.css";

const FEATURED_COUNT = 6;

function formatPushed(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays < 1) return "pushed today";
  if (diffDays === 1) return "pushed yesterday";
  if (diffDays < 30) return `pushed ${diffDays}d ago`;
  return `pushed ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

function RepoCard({ repo, pinned }: { repo: GithubRepo; pinned: boolean }) {
  const domain = classifyDomain(repo);
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
    >
      <div className={styles.cardTop}>
        <span className={styles.domain}>{DOMAIN_LABEL[domain]}</span>
        {pinned && <span className={styles.pin}>PINNED</span>}
      </div>

      <div className={styles.repoName}>{repo.name}</div>

      {repo.description ? (
        <p className={styles.desc}>{repo.description}</p>
      ) : (
        <p className={styles.descEmpty}>No log entry yet.</p>
      )}

      <div className={styles.cardFoot}>
        <span>{repo.language ?? "mixed"}</span>
        <span>{formatPushed(repo.pushed_at)}</span>
      </div>
    </a>
  );
}

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
        <h2 className={styles.title}>Modules</h2>
        <span className={styles.count}>{repos.length} loaded</span>
      </div>
      <p className={styles.sub}>
        Ranked by real traction — stars, forks, then watchers — with
        pushed date as a tiebreaker, and a couple pinned by hand regardless
        of rank.
      </p>

      <div className={styles.grid}>
        {featured.map((repo) => (
          <RepoCard key={repo.id} repo={repo} pinned={pinnedSet.has(repo.name)} />
        ))}
      </div>

      {rest.length > 0 && (
        <details className={styles.more}>
          <summary className={styles.moreSummary}>
            Show {rest.length} more module{rest.length === 1 ? "" : "s"}
          </summary>
          <div className={`${styles.grid} ${styles.moreGrid}`}>
            {rest.map((repo) => (
              <RepoCard key={repo.id} repo={repo} pinned={false} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
