"use client";

import * as React from "react";
import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { DOMAIN_LABEL, DOMAIN_EMOJI, Domain, GithubRepo, classifyDomain } from "@/lib/github";
import { PINNED_REPOS, REPO_SCREENSHOTS } from "@/lib/content";
import styles from "./RepoGrid.module.css";

// Carousel geometry. Exposed to CSS as custom properties (see trackVars
// below) so the module.css track/card sizing can never drift out of sync
// with the JS that computes scroll distance and translation.
const CARD_WIDTH = 300;
const CARD_GAP = 32;
const STEP = CARD_WIDTH + CARD_GAP;
const VIEWPORT_HEIGHT = 480; // px height of the sticky "window" onto the track
const SCROLL_PER_CARD = 380; // px of spacer scroll consumed rotating one card in

function formatPushed(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays < 1) return "pushed today";
  if (diffDays === 1) return "pushed yesterday";
  if (diffDays < 30) return `pushed ${diffDays}d ago`;
  return `pushed ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

// The two accent hues the site actually has (phosphor green via
// --signal-amber, and the dimmer graticule cyan) split across the four
// domains, so the fallback panel still reads as "domain-tinted" without
// inventing a new palette.
const DOMAIN_TINT: Record<Domain, "amber" | "cyan"> = {
  hardware: "amber",
  ai_ml: "amber",
  systems: "cyan",
  data: "cyan",
};

// Screenshot panel for the enlarged center card: a real screenshot if one has
// been sourced and approved, otherwise a domain-tinted gradient with the
// domain's emoji large and centered. Screenshots, once available, are static
// assets at `public/screenshots/<repo-name>.png`, wired in via
// REPO_SCREENSHOTS in lib/content.ts -- this component doesn't change when
// they're added, it just starts rendering an <img> instead of the gradient.
function ScreenshotPanel({ repo, domain }: { repo: GithubRepo; domain: Domain }) {
  const src = REPO_SCREENSHOTS[repo.name];
  if (src) {
    return (
      <div className={styles.media}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${repo.name} screenshot`}
          className={styles.mediaImg}
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className={styles.media} data-tint={DOMAIN_TINT[domain]}>
      <span className={styles.mediaEmoji} aria-hidden="true">
        {DOMAIN_EMOJI[domain]}
      </span>
    </div>
  );
}

function CarouselCard({
  repo,
  index,
  progress,
  total,
  pinned,
  isCenter,
}: {
  repo: GithubRepo;
  index: number;
  progress: MotionValue<number>;
  total: number;
  pinned: boolean;
  isCenter: boolean;
}) {
  const domain = classifyDomain(repo);

  // Distance (in card-widths) from this card's slot to wherever the track
  // currently sits. Drives a continuous scale/opacity/z-index falloff so
  // cards grow smoothly as they approach center rather than popping.
  const distance = useTransform(progress, (p) =>
    Math.abs(p * Math.max(total - 1, 1) - index)
  );
  const scale = useTransform(distance, [0, 1, 2], [1.1, 0.86, 0.76]);
  const opacity = useTransform(distance, [0, 1, 2.2], [1, 0.55, 0.3]);
  const z = useTransform(distance, (d) => Math.max(1, Math.round(3 - d)));

  return (
    <motion.a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.card} ${isCenter ? styles.cardCenter : ""}`}
      style={{ scale, opacity, zIndex: z }}
    >
      <div className={styles.cardTop}>
        <span className={styles.domain}>{DOMAIN_LABEL[domain]}</span>
        {pinned && <span className={styles.pin}>PINNED</span>}
      </div>

      {isCenter ? (
        <ScreenshotPanel repo={repo} domain={domain} />
      ) : (
        <div className={styles.mediaSide} data-tint={DOMAIN_TINT[domain]} aria-hidden="true">
          <span className={styles.mediaEmojiSide}>{DOMAIN_EMOJI[domain]}</span>
        </div>
      )}

      <div className={styles.repoName}>{repo.name}</div>

      {isCenter &&
        (repo.description ? (
          <p className={styles.desc}>{repo.description}</p>
        ) : (
          <p className={styles.descEmpty}>No log entry yet.</p>
        ))}

      {isCenter && (
        <div className={styles.cardFoot}>
          <span>{repo.language ?? "mixed"}</span>
          <span>{formatPushed(repo.pushed_at)}</span>
        </div>
      )}
    </motion.a>
  );
}

// Non-JS-motion fallback: every module in a single wrapped, natively
// scrollable row. Used verbatim under prefers-reduced-motion, so nobody who
// has that preference set gets the pinned-scroll track at all.
function StaticRow({ repos, pinnedSet }: { repos: GithubRepo[]; pinnedSet: Set<string> }) {
  return (
    <div className={styles.staticRow}>
      {repos.map((repo) => {
        const domain = classifyDomain(repo);
        return (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <div className={styles.cardTop}>
              <span className={styles.domain}>{DOMAIN_LABEL[domain]}</span>
              {pinnedSet.has(repo.name) && <span className={styles.pin}>PINNED</span>}
            </div>
            <ScreenshotPanel repo={repo} domain={domain} />
            <div className={styles.repoName}>{repo.name}</div>
            {repo.description ? (
              <p className={styles.desc}>{repo.description}</p>
            ) : (
              <p className={styles.descEmpty}>No log entry yet.</p>
            )}
            <div className={styles.cardFoot}>
              <span>{repo.language ?? "mixed"}</span>
              <span>{formatPushed(repo.pushed_at)}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export default function RepoGrid({ repos }: { repos: GithubRepo[] }) {
  const pinnedSet = new Set(PINNED_REPOS);
  const pinned = repos.filter((r) => pinnedSet.has(r.name));
  const unpinned = repos.filter((r) => !pinnedSet.has(r.name));
  const ordered = [...pinned, ...unpinned];
  const total = ordered.length;

  const spacerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  // Scroll progress through the tall spacer below drives horizontal
  // translation of the card track inside the sticky viewport -- a "pin and
  // translate" section, scoped to this <section> only (not full-page
  // scroll-jacking: the rest of the page scrolls completely normally before
  // and after this element).
  const { scrollYProgress } = useScroll({
    target: spacerRef,
    offset: ["start start", "end end"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    restDelta: 0.001,
  });

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    const idx = Math.round(latest * Math.max(total - 1, 1));
    setActiveIndex(Math.min(Math.max(idx, 0), Math.max(total - 1, 0)));
  });

  const maxTranslate = Math.max(total - 1, 0) * STEP;
  const trackX = useTransform(smoothProgress, [0, 1], [0, -maxTranslate]);

  const trackVars = {
    "--card-w": `${CARD_WIDTH}px`,
    "--card-gap": `${CARD_GAP}px`,
  } as React.CSSProperties;

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Modules</h2>
        <span className={styles.count}>{repos.length} loaded</span>
      </div>
      <p className={styles.sub}>
        Ranked by real traction — stars, forks, then watchers — with pushed
        date as a tiebreaker, and a couple pinned by hand regardless of rank.
        {total > 0 && !reduce ? " Scroll to rotate through every module." : ""}
      </p>

      {total === 0 ? (
        <p className={styles.descEmpty}>No modules loaded.</p>
      ) : reduce ? (
        <StaticRow repos={ordered} pinnedSet={pinnedSet} />
      ) : (
        <div
          ref={spacerRef}
          className={styles.spacer}
          style={{ height: `${total * SCROLL_PER_CARD + VIEWPORT_HEIGHT}px` }}
        >
          <div className={styles.viewport} style={{ height: `${VIEWPORT_HEIGHT}px` }}>
            <motion.div className={styles.track} style={{ ...trackVars, x: trackX }}>
              {ordered.map((repo, i) => (
                <CarouselCard
                  key={repo.id}
                  repo={repo}
                  index={i}
                  progress={smoothProgress}
                  total={total}
                  pinned={pinnedSet.has(repo.name)}
                  isCenter={i === activeIndex}
                />
              ))}
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );
}
