"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DOMAIN_LABEL, Domain, GithubRepo } from "@/lib/github";
import type { ProjectDetail } from "@/lib/content";
import ProjectMark from "./ProjectMark";
import styles from "./ProjectsSection.module.css";

export interface ProjectEntry {
  repo: GithubRepo;
  domain: Domain;
  pinned: boolean;
  detail?: ProjectDetail;
  visual?: string;
  liveUrl?: string;
  /** Rendered on the server. Computing "pushed 3d ago" in the component would
   *  use Date.now() at hydration, which differs from the value baked in at
   *  build time and trips a hydration mismatch. */
  pushedLabel: string;
}

/** Rows shown before the fade/blur cutoff. */
const VISIBLE_ROWS = 2;

/** Below this many cards, skip the clip/fade/"see all" machinery entirely --
 *  a filtered tag (e.g. "Data") can leave only a handful of cards, and a
 *  short grid doesn't need a collapse affordance for rows it never fills. */
const COLLAPSE_THRESHOLD = 6;

/** A filter chip. "featured" and "all" sit outside the Domain union, so the
 *  filter bar can offer "just the highlights" and "everything" alongside the
 *  four real domain buckets. */
type FilterTag = "featured" | Domain | "all";

const FILTER_ORDER: FilterTag[] = ["featured", "ai_ml", "hardware", "systems", "data", "all"];

/** Short chip labels. Domain cards elsewhere use DOMAIN_LABEL's fuller,
 *  uppercase form ("AI / ML"); the filter bar wants something a click target
 *  can hold without wrapping. */
const FILTER_LABEL: Record<FilterTag, string> = {
  featured: "Featured",
  ai_ml: "AI",
  hardware: "Hardware",
  systems: "Systems",
  data: "Data",
  all: "All",
};

function matchesFilter(entry: ProjectEntry, tag: FilterTag): boolean {
  if (tag === "featured") return entry.pinned;
  if (tag === "all") return true;
  return entry.domain === tag;
}

/** Cycled in the vacated card slot while a project is open. */
const SLOT_EMOJI = ["🔧", "⚙️", "📐", "🛠️", "🧪", "📎", "🔬", "✏️"];
const SLOT_EMOJI_MS = 1800;

/** The card the user opened leaves a gap in the grid; fill it with something
 *  alive rather than a dimmed ghost of the card that moved. Holds still for
 *  anyone who prefers reduced motion. */
function EmojiSlot({ reduce }: { reduce: boolean | null }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % SLOT_EMOJI.length), SLOT_EMOJI_MS);
    return () => window.clearInterval(t);
  }, [reduce]);
  return (
    <div className={styles.emojiSlot} aria-hidden="true">
      <span key={i} className={styles.emojiGlyph}>
        {SLOT_EMOJI[i]}
      </span>
    </div>
  );
}

function Visual({ entry, large }: { entry: ProjectEntry; large?: boolean }) {
  if (entry.visual) {
    return (
      <Image
        src={entry.visual}
        alt={`${entry.repo.name} preview`}
        fill
        sizes={large ? "(max-width: 900px) 100vw, 46vw" : "(max-width: 900px) 100vw, 30vw"}
        className={styles.visualImg}
        unoptimized
      />
    );
  }
  // No genuine screenshot for this repo — fall back to the generative mark.
  return (
    <div className={styles.markWrap} aria-hidden="true">
      <ProjectMark repoName={entry.repo.name} domain={entry.domain} active={Boolean(large)} />
    </div>
  );
}

export default function ProjectsSection({ entries }: { entries: ProjectEntry[] }) {
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  // Featured-first by default so the grid opens on the projects worth a
  // glance, not a wall of every repo. Falls back to "all" if nothing is
  // pinned, since a "Featured" tab that always shows zero results is worse
  // than not defaulting to it.
  const [activeTag, setActiveTag] = useState<FilterTag>(() =>
    entries.some((e) => e.pinned) ? "featured" : "all"
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Only offer a chip if it would actually show something -- an empty
  // "Data" tag that always renders zero cards is just a dead click.
  const availableTags = useMemo(
    () => FILTER_ORDER.filter((tag) => tag === "all" || entries.some((e) => matchesFilter(e, tag))),
    [entries]
  );

  const filteredEntries = useMemo(
    () => entries.filter((e) => matchesFilter(e, activeTag)),
    [entries, activeTag]
  );

  const canCollapse = filteredEntries.length > COLLAPSE_THRESHOLD;

  const selectTag = useCallback((tag: FilterTag) => {
    setActiveTag(tag);
    // A new filter is a new list -- start it collapsed rather than carrying
    // over however far the previous filter had been expanded.
    setExpanded(false);
  }, []);

  const open = entries.find((e) => e.repo.id === openId) ?? null;

  const close = useCallback(() => setOpenId(null), []);

  // Escape closes the detail panel, and focus moves into it when it opens so
  // keyboard users aren't stranded at the bottom of the grid.
  useEffect(() => {
    if (openId == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, close]);

  return (
    <section className={styles.section} ref={sectionRef}>
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>selected</p>
          <h2 className={styles.title}>Projects</h2>
        </div>
        <span className={styles.count}>
          {activeTag === "all" ? `${entries.length} loaded` : `${filteredEntries.length} of ${entries.length}`}
        </span>
      </div>
      <p className={styles.sub}>
        Pulled live from GitHub. Click any project for what it is, why I built
        it, and what the tradeoffs taught me.
      </p>

      <div className={styles.filterBar} role="group" aria-label="Filter projects by category">
        {availableTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={styles.filterTag}
            aria-pressed={activeTag === tag}
            data-active={activeTag === tag || undefined}
            onClick={() => selectTag(tag)}
          >
            {FILTER_LABEL[tag]}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key={open.repo.id}
            ref={panelRef}
            tabIndex={-1}
            className={styles.panel}
            // These props must not branch on `reduce`: useReducedMotion() is
            // false during SSR and true on the client for users who prefer
            // reduced motion, so branching here renders different inline styles
            // on each side, fails hydration, and React regenerates the tree --
            // which showed up as two stacked dialogs. Only `transition` varies,
            // since it never reaches the DOM.
            layoutId={`project-${open.repo.id}`}
            initial={false}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
            role="dialog"
            aria-modal="false"
            aria-label={`${open.repo.name} details`}
          >
            <div className={styles.panelVisual}>
              <Visual entry={open} large />
            </div>

            <div className={styles.panelBody}>
              <div className={styles.panelTop}>
                <span className={styles.domain}>{DOMAIN_LABEL[open.domain]}</span>
                {open.pinned && <span className={styles.pin}>PINNED</span>}
                <button type="button" className={styles.close} onClick={close} aria-label="Close details">
                  ✕
                </button>
              </div>

              <h3 className={styles.panelName}>{open.repo.name}</h3>

              <div className={styles.block}>
                <h4 className={styles.blockTitle}>What it is</h4>
                <p className={styles.blockBody}>
                  {open.detail?.what ?? open.repo.description ?? "No description yet."}
                </p>
              </div>

              {open.detail?.why && (
                <div className={styles.block}>
                  <h4 className={styles.blockTitle}>Why I built it</h4>
                  <p className={styles.blockBody}>{open.detail.why}</p>
                </div>
              )}

              {open.detail?.learned && (
                <div className={styles.block}>
                  <h4 className={styles.blockTitle}>Tradeoffs &amp; what I learned</h4>
                  <p className={styles.blockBody}>{open.detail.learned}</p>
                </div>
              )}

              {!open.detail && (
                <p className={styles.thin}>
                  Write-up still to come — the repo is the better read for now.
                </p>
              )}

              <div className={styles.panelFoot}>
                <span>{open.repo.language ?? "mixed"}</span>
                <span>{open.pushedLabel}</span>
                <a href={open.repo.html_url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  Repository ↗
                </a>
                {open.liveUrl && (
                  <a href={open.liveUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    Live site ↗
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`${styles.gridWrap} ${!canCollapse || expanded ? styles.gridOpen : styles.gridClipped}`}
        style={{ "--visible-rows": VISIBLE_ROWS } as React.CSSProperties}
      >
        <div className={styles.grid}>
          {filteredEntries.map((entry) => {
            const isOpen = entry.repo.id === openId;
            if (isOpen) {
              // The card itself has warped up into the panel above, so this
              // slot would otherwise collapse and reflow the whole grid.
              return <EmojiSlot key={entry.repo.id} reduce={reduce} />;
            }
            return (
              <motion.button
                key={entry.repo.id}
                type="button"
                layoutId={`project-${entry.repo.id}`}
                className={styles.card}
                data-project-card=""
                onClick={() => setOpenId(isOpen ? null : entry.repo.id)}
                aria-expanded={false}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
              >
                <span className={styles.cardVisual}>
                  <Visual entry={entry} />
                </span>
                <span className={styles.cardTop}>
                  <span className={styles.domain}>{DOMAIN_LABEL[entry.domain]}</span>
                  {entry.pinned && <span className={styles.pin}>PINNED</span>}
                </span>
                <span className={styles.cardName}>{entry.repo.name}</span>
                <span className={styles.cardDesc}>
                  {entry.repo.description ?? "No description yet."}
                </span>
                <span className={styles.cardFoot}>
                  <span>{entry.repo.language ?? "mixed"}</span>
                  <span>{entry.pushedLabel}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
        {canCollapse && !expanded && <div className={styles.fade} aria-hidden="true" />}
      </div>

      {canCollapse && !expanded && (
        <div className={styles.moreRow}>
          <button type="button" className={styles.moreBtn} onClick={() => setExpanded(true)}>
            See all {filteredEntries.length} projects
          </button>
        </div>
      )}
      {canCollapse && expanded && (
        <div className={styles.moreRow}>
          <button
            type="button"
            className={styles.moreBtn}
            onClick={() => {
              setExpanded(false);
              sectionRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
            }}
          >
            Show fewer
          </button>
        </div>
      )}
    </section>
  );
}
