"use client";

import { ReactNode, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import styles from "./Reveal.module.css";

const ROT_INITIAL = {
  opacity: 0,
  y: 48,
  rotate: -1.8,
  scale: 0.97,
  filter: "blur(8px) sepia(0.5) contrast(1.1) saturate(0.75)",
};

const ROT_CLEAR = {
  opacity: 1,
  y: 0,
  rotate: 0,
  scale: 1,
  filter: "blur(0px) sepia(0) contrast(1) saturate(1)",
};

// Scroll-scrubbed "organic rot" reveal: foxed + soft-focused + slightly
// twisted at first, then clarifies into clean paper. Once a section has
// fully cleared, we latch so it never re-rots or stays clipped.
export default function Reveal({
  id,
  children,
  delay = 0,
  mode = "scroll",
}: {
  id: string;
  children: ReactNode;
  delay?: number;
  mode?: "scroll" | "mount";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [settled, setSettled] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    // Finish clarifying while the section is still entering — avoids
    // leaving tall blocks half-decayed after they fill the viewport.
    offset: ["start 95%", "start 55%"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v >= 0.97) setSettled(true);
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 0.8, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [56, 0]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-2, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.96, 1]);
  const filter = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [
      "blur(8px) sepia(0.5) contrast(1.1) saturate(0.75)",
      "blur(2.5px) sepia(0.18) contrast(1.04) saturate(0.9)",
      "blur(0px) sepia(0) contrast(1) saturate(1)",
    ]
  );

  const moldOpacity = useTransform(
    scrollYProgress,
    [0, 0.35, 0.8, 1],
    [0.9, 0.5, 0.1, 0]
  );
  const moldScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.16]);
  const moldRotate = useTransform(scrollYProgress, [0, 1], [0, 6]);
  const sporeY = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const sporeOpacity = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    [0.5, 0.18, 0]
  );

  if (reduce) {
    return (
      <div id={id} className={styles.wrap}>
        {children}
      </div>
    );
  }

  if (mode === "mount") {
    return (
      <motion.div
        id={id}
        className={styles.wrap}
        initial={ROT_INITIAL}
        animate={ROT_CLEAR}
        transition={{
          duration: 1.25,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <motion.div
          className={styles.mold}
          initial={{ opacity: 0.75, scale: 1.03, rotate: 0 }}
          animate={{ opacity: 0, scale: 1.14, rotate: 8 }}
          transition={{ duration: 1.3, delay, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={i}
            className={styles.spore}
            initial={{ opacity: 0.45, y: 0 }}
            animate={{ opacity: 0, y: -28 }}
            transition={{
              duration: 1.1,
              delay: delay + 0.08 + i * 0.05,
              ease: "easeOut",
            }}
            aria-hidden
          />
        ))}
        <div className={styles.content}>{children}</div>
      </motion.div>
    );
  }

  if (settled) {
    return (
      <div id={id} className={styles.wrap} ref={ref}>
        <div className={styles.content}>{children}</div>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      id={id}
      className={styles.wrap}
      style={{
        opacity,
        y,
        rotate,
        scale,
        filter,
      }}
    >
      <motion.div
        className={styles.mold}
        style={{
          opacity: moldOpacity,
          scale: moldScale,
          rotate: moldRotate,
        }}
        aria-hidden
      />
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          className={styles.spore}
          style={{ y: sporeY, opacity: sporeOpacity }}
          aria-hidden
        />
      ))}
      <div className={styles.content}>{children}</div>
    </motion.div>
  );
}
