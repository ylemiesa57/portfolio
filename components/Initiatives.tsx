import { Initiative } from "@/lib/content";
import styles from "./Initiatives.module.css";

export default function Initiatives({ items }: { items: Initiative[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Current initiatives</h2>
      </div>
      <p className={styles.sub}>
        What&apos;s running outside of a repository.
      </p>

      <div className={styles.grid}>
        {items.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <span className={styles.tag}>EXTERNAL</span>
            <span className={styles.name}>{item.name}</span>
            <span className={styles.role}>{item.role}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
