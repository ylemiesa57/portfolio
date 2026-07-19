import { Award } from "@/lib/content";
import styles from "./Awards.module.css";

function AwardCard({ award }: { award: Award }) {
  const inner = (
    <>
      <span className={styles.year}>{award.year}</span>
      <span className={styles.awardTitle}>{award.title}</span>
      <span className={styles.detail}>{award.detail}</span>
    </>
  );

  if (award.url) {
    return (
      <a
        href={award.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.card}
      >
        {inner}
      </a>
    );
  }

  return <div className={styles.card}>{inner}</div>;
}

export default function Awards({ items }: { items: Award[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Awards</h2>
      </div>

      <div className={styles.grid}>
        {items.map((award) => (
          <AwardCard key={award.title} award={award} />
        ))}
      </div>
    </section>
  );
}
