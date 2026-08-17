"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DOMAIN_LABEL, Domain, GithubRepo } from "@/lib/github";
import type { ProjectReadme } from "@/lib/readme";
import ProjectMark from "./ProjectMark";
import styles from "./ProjectsSection.module.css";

export interface ProjectEntry {
  repo: GithubRepo;
  domain: Domain;
  pinned: boolean;
  readme: ProjectReadme;
  visual?: string;
  liveUrl?: string;
  /** Rendered on the server. Computing "pushed 3d ago" in the component would
   *  use Date.now() at hydration, which differs from the value baked in at
   *  build time and trips a hydration mismatch. */
  pushedLabel: string;
}

/** Rows shown before the fade/blur cutoff. */
const VISIBLE_ROWS = 2;

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
  const panelRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

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
        <span className={styles.count}>{entries.length} loaded</span>
      </div>
      <p className={styles.sub}>
        Pulled live from GitHub, with each card&apos;s write-up read from that
        repo&apos;s own README. Click one to open it.
      </p>

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
              <p className={styles.panelSummary}>{open.readme.summary}</p>

              {open.readme.findings && (
                <div className={styles.block}>
                  <h4 className={styles.blockTitle}>What&apos;s in it</h4>
                  <p className={styles.blockBody}>{open.readme.findings}</p>
                </div>
              )}

              {open.readme.tradeoffs && (
                <div className={styles.block}>
                  <h4 className={styles.blockTitle}>Tradeoffs &amp; limits</h4>
                  <p className={styles.blockBody}>{open.readme.tradeoffs}</p>
                </div>
              )}

              {!open.readme.hasDepth && (
                <p className={styles.thin}>
                  This repo&apos;s README is still light on write-up — the full
                  source is the better read for now.
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
        className={`${styles.gridWrap} ${expanded ? styles.gridOpen : styles.gridClipped}`}
        style={{ "--visible-rows": VISIBLE_ROWS } as React.CSSProperties}
      >
        <div className={styles.grid}>
          {entries.map((entry) => {
            const isOpen = entry.repo.id === openId;
            return (
              <motion.button
                key={entry.repo.id}
                type="button"
                layoutId={`project-${entry.repo.id}`}
                className={`${styles.card} ${isOpen ? styles.cardOpen : ""}`}
                onClick={() => setOpenId(isOpen ? null : entry.repo.id)}
                aria-expanded={isOpen}
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
        {!expanded && <div className={styles.fade} aria-hidden="true" />}
      </div>

      {!expanded && (
        <div className={styles.moreRow}>
          <button type="button" className={styles.moreBtn} onClick={() => setExpanded(true)}>
            See all {entries.length} projects
          </button>
        </div>
      )}
      {expanded && (
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
