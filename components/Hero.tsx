import Image from "next/image";
import IntroLine from "./IntroLine";
import styles from "./Hero.module.css";

export default function Hero({
  name,
  tagline,
  projectCount,
  publicationCount,
  ossCount,
  photoSrc,
}: {
  name: string;
  tagline: string;
  projectCount: number;
  publicationCount: number;
  ossCount: number;
  photoSrc?: string;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.stage}>
        <div className={styles.copy}>
          <IntroLine />
          <h1 className={styles.name}>{name}</h1>
          <p className={styles.tagline}>{tagline}</p>

          <p className={styles.note}>
            MIT and NASA work stays private — ask, and I&apos;ll walk you through it.
          </p>

          {/* Counts that mean something to a reader. The previous trio
              (public repos / languages / domains) were vanity metrics: number
              of languages says nothing about depth, and the domain count
              duplicated the chips that sat directly beneath it. */}
          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Shipped projects</dt>
              <dd className={styles.statValue}>{projectCount}</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Publications</dt>
              <dd className={styles.statValue}>{publicationCount}</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Open-source PRs</dt>
              <dd className={styles.statValue}>{ossCount}</dd>
            </div>
          </dl>
        </div>

        {photoSrc && (
          <div className={styles.photoFrame}>
            <div className={styles.photoBox}>
              <Image
                src={photoSrc}
                alt={name}
                fill
                sizes="(max-width: 720px) 132px, 220px"
                className={styles.photoImg}
                priority
                unoptimized
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
