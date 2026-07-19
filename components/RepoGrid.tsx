import { DOMAIN_LABEL, GithubRepo, classifyDomain } from "@/lib/github";
import styles from "./RepoGrid.module.css";

function formatPushed(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays < 1) return "pushed today";
  if (diffDays === 1) return "pushed yesterday";
  if (diffDays < 30) return `pushed ${diffDays}d ago`;
  return `pushed ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

export default function RepoGrid({ repos }: { repos: GithubRepo[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Modules</h2>
        <span className={styles.count}>{repos.length} loaded</span>
      </div>
      <p className={styles.sub}>
        Every public repository, pulled live off GitHub — sorted by what has
        traction, then by what shipped most recently.
      </p>

      <div className={styles.grid}>
        {repos.map((repo) => {
          const domain = classifyDomain(repo);
          return (
            <a
              key={repo.id}
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
        })}
      </div>
    </section>
  );
}
