import Link from "next/link";
import { Initiative } from "@/lib/content";
import styles from "./Initiatives.module.css";

export default function Initiatives({ items }: { items: Initiative[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Current initiatives</h2>
      </div>
      <p className={styles.sub}>
        What&apos;s running outside of a repository. Click one to read the full entry.
      </p>

      <div className={styles.grid}>
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/initiatives/${item.slug}`}
            className={styles.card}
          >
            <span className={styles.tag}>EXTERNAL</span>
            <span className={styles.name}>{item.name}</span>
            <span className={styles.role}>{item.role}</span>
            <p className={styles.summary}>{item.summary}</p>
            <span className={styles.readMore}>Read entry →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
