import Image from "next/image";
import CircuitTrace, { TraceNode } from "./CircuitTrace";
import styles from "./Hero.module.css";

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
  domains: TraceNode[];
  photoSrc?: string;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.top}>
        <div className={styles.main}>
          <div className={styles.eyebrowRow}>
            <span className="eyebrow">Working drawing</span>
            <span className={styles.rule} />
          </div>

          <h1 className={styles.name}>{name}</h1>

          <p className={styles.tagline}>{tagline}</p>
          <p className={styles.note}>
            <strong>Note —</strong> the best of it is off this page: MIT and
            NASA repos stay private. Ask, and I&apos;ll walk you through them.
          </p>
        </div>

        {photoSrc && (
          <div className={styles.photoFrame}>
            <div className={styles.photoBox}>
              <Image
                src={photoSrc}
                alt={name}
                width={168}
                height={168}
                className={styles.photoImg}
                priority
              />
            </div>
            <p className={styles.photoCaption}>Fig. 1 — subject</p>
          </div>
        )}
      </div>

      <div className={styles.traceWrap}>
        <CircuitTrace nodes={domains} />
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{repoCount}</div>
          <div className={styles.statLabel}>Public repos</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{languageCount}</div>
          <div className={styles.statLabel}>Languages in use</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{domains.length}</div>
          <div className={styles.statLabel}>Active domains</div>
        </div>
      </div>
    </section>
  );
}
