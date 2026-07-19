import { OSSContribution } from "@/lib/content";
import styles from "./OSSContributions.module.css";

export default function OSSContributions({ items }: { items: OSSContribution[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Open source contributions</h2>
      </div>
      <p className={styles.sub}>
        Pull requests filed against projects I don&apos;t own.
      </p>

      <div className={styles.list}>
        {items.map((item) => (
          <a
            key={item.repo}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.entry}
          >
            <div className={styles.repoName}>{item.repo}</div>
            <p className={styles.desc}>{item.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
