import Image from "next/image";
import styles from "./Hero.module.css";

export type HeroDomain = { label: string; count: number };

export default function Hero({
  name,
  tagline,
  repoCount,
  languageCount,
  domains,
  photoSrc,
}: {
  name: string;
  tagline: string;
  repoCount: number;
  languageCount: number;
  domains: HeroDomain[];
  photoSrc?: string;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.stage}>
        <div className={styles.copy}>
          <h1 className={styles.name}>{name}</h1>
          <p className={styles.tagline}>{tagline}</p>

          {domains.length > 0 && (
            <ul className={styles.domains} aria-label="Active domains">
              {domains.map((d) => (
                <li key={d.label} className={styles.chip}>
                  {d.label}
                  <span className={styles.chipCount}>{d.count}</span>
                </li>
              ))}
            </ul>
          )}

          <p className={styles.note}>
            MIT and NASA work stays private — ask, and I&apos;ll walk you through it.
          </p>

          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Public repos</dt>
              <dd className={styles.statValue}>{repoCount}</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Languages</dt>
              <dd className={styles.statValue}>{languageCount}</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Domains</dt>
              <dd className={styles.statValue}>{domains.length}</dd>
            </div>
          </dl>
        </div>

        {photoSrc && (
          <div className={styles.photoFrame}>
            <div className={styles.photoBox}>
              <Image
                src={photoSrc}
                alt={name}
                width={220}
                height={220}
                className={styles.photoImg}
                priority
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
