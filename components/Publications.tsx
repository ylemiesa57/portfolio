import { Publication, SCHOLAR_URL } from "@/lib/content";
import styles from "./Publications.module.css";

export default function Publications({ items }: { items: Publication[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Publications</h2>
      </div>
      <p className={styles.sub}>
        Research on AI and cyber-risk modeling for critical infrastructure —
        full record on{" "}
        <a href={SCHOLAR_URL} target="_blank" rel="noopener noreferrer">
          Google Scholar
        </a>
        .
      </p>

      <div className={styles.list}>
        {items.map((pub, i) => (
          <div key={pub.title} className={styles.entry}>
            <span className={styles.index}>[{i + 1}]</span>
            <div className={styles.body}>
              <p className={styles.paperTitle}>{pub.title}</p>
              <p className={styles.authors}>{pub.authors}</p>
              <p className={styles.venue}>{pub.venue}</p>
            </div>
            <div className={styles.meta}>
              <span>{pub.year}</span>
              {pub.citedBy ? (
                <span className={styles.cited}>cited by {pub.citedBy}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
