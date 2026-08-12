"use client";

import { useRef, useState, type CSSProperties } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import {
  DOMAIN_LABEL,
  DOMAIN_EMOJI,
  Domain,
  GithubRepo,
  classifyDomain,
  popularityScore,
} from "@/lib/github";
import { PINNED_REPOS } from "@/lib/content";
import ProjectMark from "./ProjectMark";
import styles from "./RepoGrid.module.css";

const GITHUB_PROFILE_URL = "https://github.com/ylemiesa57?tab=repositories";

// "AI/ML and software engineering" -- the two classifyDomain buckets that
// actually describe Yaphet's focus, out of the four (hardware/ai_ml/systems/
// data). Everything else is left off the featured carousel for now.
const FEATURED_DOMAINS: Domain[] = ["ai_ml", "systems"];
const MAX_FEATURED = 8;

// Arc geometry for the semicircular carousel. Each card sits at an angle
// derived from (its index - scroll progress), positioned with sin/cos onto
// a real circular arc rather than a straight track -- this is what makes it
// "semicircular" instead of a linear filmstrip.
const ANGLE_STEP = 15; // degrees between adjacent card slots
const MAX_ANGLE = 68; // beyond this a card is fully faded out
const ARC_RADIUS = 620; // px, radius of the arc cards travel along
const VIEWPORT_HEIGHT = 460;
const SCROLL_PER_CARD = 340;

function formatPushed(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays < 1) return "pushed today";
  if (diffDays === 1) return "pushed yesterday";
  if (diffDays < 30) return `pushed ${diffDays}d ago`;
  return `pushed ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

// Ambient decoration: real emoji drifting slowly behind the card arc. Purely
// visual, aria-hidden -- distinct from the small per-card domain emoji
// ProjectMark's glyphs already carry.
const FLOAT_EMOJI = [DOMAIN_EMOJI.ai_ml, DOMAIN_EMOJI.systems, DOMAIN_EMOJI.hardware, DOMAIN_EMOJI.data, DOMAIN_EMOJI.ai_ml];

function FloatingEmoji() {
  return (
    <div className={styles.emojiField} aria-hidden="true">
      {FLOAT_EMOJI.map((e, i) => {
        const style = {
          "--fx": `${8 + i * 21}%`,
          "--fy": `${18 + (i % 2) * 48}%`,
          "--fdelay": `${i * 1.1}s`,
          "--fdur": `${7 + i * 1.4}s`,
        } as CSSProperties;
        return (
          <span key={i} className={styles.floatEmoji} style={style}>
            {e}
          </span>
        );
      })}
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

  // Angle (degrees) of this card's slot relative to center, as scroll
  // progress sweeps the whole arc. index 0 sits at the positive end and
  // rotates through 0 (dead center) to negative as progress -> 1.
  const angle = useTransform(
    progress,
    (p) => (index - p * Math.max(total - 1, 1)) * ANGLE_STEP
  );
  const x = useTransform(angle, (a) => Math.sin((a * Math.PI) / 180) * ARC_RADIUS);
  // Cards curve down and back as they swing away from center, so the arc
  // reads as a real semicircle (a fan spread below the centerline) instead
  // of a flat row that merely rotates in place.
  const y = useTransform(
    angle,
    (a) => (1 - Math.cos((a * Math.PI) / 180)) * ARC_RADIUS * 0.32
  );
  const rotate = useTransform(angle, (a) => a * 0.55);
  const scale = useTransform(angle, (a) => {
    const t = Math.min(Math.abs(a) / MAX_ANGLE, 1);
    return 1.05 - t * 0.4;
  });
  const opacity = useTransform(angle, (a) => {
    const t = Math.min(Math.abs(a) / MAX_ANGLE, 1);
    return t >= 1 ? 0 : 1 - t * 0.85;
  });
  const zIndex = useTransform(angle, (a) => Math.round(200 - Math.abs(a)));

  return (
    <motion.a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.card} ${isCenter ? styles.cardCenter : ""}`}
      style={{ x, y, rotate, scale, opacity, zIndex }}
    >
      <ProjectMark repoName={repo.name} domain={domain} active={isCenter} />

      <div className={styles.cardTop}>
        <span className={styles.domain}>{DOMAIN_LABEL[domain]}</span>
        {pinned && <span className={styles.pin}>PINNED</span>}
      </div>

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

// Non-JS-motion fallback: every featured module in a single wrapped,
// natively scrollable row. Used verbatim under prefers-reduced-motion, so
// nobody with that preference gets the arc/scroll-jacked track at all.
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
            <ProjectMark repoName={repo.name} domain={domain} />
            <div className={styles.cardTop}>
              <span className={styles.domain}>{DOMAIN_LABEL[domain]}</span>
              {pinnedSet.has(repo.name) && <span className={styles.pin}>PINNED</span>}
            </div>
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
  const featuredDomains = new Set(FEATURED_DOMAINS);

  // Only AI/ML + software-engineering-flavored repos are eligible; pinned
  // picks lead, the rest fill in by real traction (stars/forks/watchers),
  // capped to MAX_FEATURED. Anything past that lives on GitHub itself --
  // see the "see more" link below, not an inline expander.
  const eligible = repos.filter((r) => featuredDomains.has(classifyDomain(r)));
  const pinned = eligible.filter((r) => pinnedSet.has(r.name));
  const unpinned = eligible
    .filter((r) => !pinnedSet.has(r.name))
    .sort((a, b) => popularityScore(b) - popularityScore(a));
  const ordered = [...pinned, ...unpinned].slice(0, MAX_FEATURED);
  const total = ordered.length;

  const spacerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  // Scroll progress through the tall spacer below drives the arc sweep --
  // scoped to this <section> only (not full-page scroll-jacking: the page
  // scrolls completely normally before and after it). The heading + arc
  // together are the sticky unit, so "Modules" stays on screen the whole
  // time the carousel is being scrolled through.
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

  return (
    <section className={styles.section}>
      <div
        ref={spacerRef}
        className={styles.spacer}
        style={{ height: `${total * SCROLL_PER_CARD + VIEWPORT_HEIGHT}px` }}
      >
        <div className={styles.pinned}>
          <div className={styles.heading}>
            <h2 className={styles.title}>Modules</h2>
            <span className={styles.count}>{total} featured · AI/ML &amp; software</span>
          </div>
          <p className={styles.sub}>
            {total > 0 && !reduce
              ? "Scroll to swing through the arc -- pinned picks lead, ranked by real traction after that."
              : "Pinned picks, ranked by real traction after that."}
          </p>

          {total === 0 ? (
            <p className={styles.descEmpty}>No AI/ML or software modules loaded.</p>
          ) : reduce ? (
            <StaticRow repos={ordered} pinnedSet={pinnedSet} />
          ) : (
            <div className={styles.viewport} style={{ height: `${VIEWPORT_HEIGHT}px` }}>
              <FloatingEmoji />
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
            </div>
          )}

          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.seeMore}
          >
            See every repo on GitHub ↗
          </a>
        </div>
      </div>
    </section>
  );
}
