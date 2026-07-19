import { DOMAIN_LABEL, GithubRepo, classifyDomain } from "@/lib/github";
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

function RepoCard({ repo }: { repo: GithubRepo }) {
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
        <span className={styles.stars}>★ {repo.stargazers_count}</span>
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
  const featured = repos.slice(0, FEATURED_COUNT);
  const rest = repos.slice(FEATURED_COUNT);

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Modules</h2>
        <span className={styles.count}>{repos.length} loaded</span>
      </div>
      <p className={styles.sub}>
        Ranked by real traction first — stars, then forks, then watchers —
        and by what shipped most recently as a tiebreaker.
      </p>

      <div className={styles.grid}>
        {featured.map((repo) => (
          <RepoCard key={repo.id} repo={repo} />
        ))}
      </div>

      {rest.length > 0 && (
        <details className={styles.more}>
          <summary className={styles.moreSummary}>
            Show {rest.length} more module{rest.length === 1 ? "" : "s"}
          </summary>
          <div className={`${styles.grid} ${styles.moreGrid}`}>
            {rest.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
