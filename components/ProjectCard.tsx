"use client";

import { PointerEvent, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { DOMAIN_LABEL, Domain, GithubRepo } from "@/lib/github";
import ProjectMark from "./ProjectMark";
import styles from "./RepoGrid.module.css";

const DOMAIN_EMOJIS: Record<Domain, [string, string]> = {
  hardware: ["⚙️", "🔧"],
  ai_ml: ["✨", "🤖"],
  systems: ["⚡", "💻"],
  data: ["📊", "💫"],
};

function formatPushed(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays < 1) return "pushed today";
  if (diffDays === 1) return "pushed yesterday";
  if (diffDays < 30) return `pushed ${diffDays}d ago`;
  return `pushed ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

export default function ProjectCard({
  repo,
  pinned,
  domain,
  interactive = true,
}: {
  repo: GithubRepo;
  pinned: boolean;
  domain: Domain;
  interactive?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);
  const [emojiTR, emojiBL] = DOMAIN_EMOJIS[domain];

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotX = useSpring(rawY, { stiffness: 220, damping: 18, mass: 0.4 });
  const rotY = useSpring(rawX, { stiffness: 220, damping: 18, mass: 0.4 });
  const lift = useSpring(0, { stiffness: 260, damping: 20 });

  function onMove(e: PointerEvent<HTMLAnchorElement>) {
    if (reduce || !interactive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rawX.set((px - 0.5) * 14);
    rawY.set((0.5 - py) * 10);
  }

  function onEnter() {
    if (!interactive) return;
    setHovered(true);
    if (!reduce) lift.set(-6);
  }

  function onLeave() {
    setHovered(false);
    rawX.set(0);
    rawY.set(0);
    lift.set(0);
  }

  return (
    <div className={styles.cardShell}>
      <span className={`${styles.spinEmoji} ${styles.spinTR}`} aria-hidden="true">
        {emojiTR}
      </span>
      <span className={`${styles.spinEmoji} ${styles.spinBL}`} aria-hidden="true">
        {emojiBL}
      </span>
      <motion.a
        ref={ref}
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        draggable={false}
        tabIndex={interactive ? 0 : -1}
        aria-hidden={interactive ? undefined : true}
        className={`${styles.card} ${hovered ? styles.cardHot : ""}`}
        style={
          reduce
            ? undefined
            : {
                rotateX: rotX,
                rotateY: rotY,
                y: lift,
                transformPerspective: 800,
              }
        }
        onPointerMove={onMove}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
      >
        <ProjectMark repoName={repo.name} domain={domain} active={hovered} />

        <div className={styles.cardTop}>
          <span className={styles.domain}>{DOMAIN_LABEL[domain]}</span>
          {pinned && <span className={styles.pin}>PINNED</span>}
        </div>

        <div className={styles.repoName}>{repo.name}</div>

        {repo.description ? (
          <p className={styles.desc}>{repo.description}</p>
        ) : (
          <p className={styles.descEmpty}>No log entry yet.</p>
        )}

        <div className={styles.cardFoot}>
          <span>{repo.language ?? "mixed"}</span>
          <span className={styles.peek}>{hovered ? "open ↗" : formatPushed(repo.pushed_at)}</span>
        </div>
      </motion.a>
    </div>
  );
}
