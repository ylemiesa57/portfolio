import styles from "./Footer.module.css";

export default function Footer({
  githubUrl,
  email,
}: {
  githubUrl: string;
  email?: string;
}) {
  return (
    <footer className={styles.footer}>
      <div className={styles.left}>
        <span className={styles.stamp}>APPROVED FOR REVIEW</span>
        <span className={styles.meta}>SHEET 01 OF 01 · rendered at build time from the GitHub API</span>
      </div>
      <nav className={styles.links}>
        <a
          className={styles.link}
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          GITHUB ↗
        </a>
        {email && (
          <a className={styles.link} href={`mailto:${email}`}>
            EMAIL ↗
          </a>
        )}
      </nav>
    </footer>
  );
}
