import Image from "next/image";
import { TraceNode } from "./CircuitTrace";
import styles from "./Hero.module.css";

// Kept intentionally minimal: nav lives in TitleBar now, so Hero's only job
// is the photo + name. tagline/repoCount/languageCount/domains stay in the
// props contract (app/page.tsx already computes them from live GitHub data)
// but aren't rendered here anymore -- trimmed at Yaphet's request rather
// than threaded back out of page.tsx.
export default function Hero({
  name,
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
          </div>
        )}

        <h1 className={styles.name}>{name}</h1>
      </div>
    </section>
  );
}
