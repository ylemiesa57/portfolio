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
};

const ROT_CLEAR = {
  opacity: 1,
  y: 0,
  rotate: 0,
  scale: 1,
};

// Scroll-scrubbed "organic rot" reveal. Transform the section gently;
// foxing/blur lives on a separate mold layer so text never gets clipped
// by filter overflow.
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
    offset: ["start 95%", "start 55%"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v >= 0.97) setSettled(true);
  });

  const opacity = useTransform(scrollYProgress, [0, 0.25, 1], [0, 0.85, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [48, 0]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-1.6, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.975, 1]);

  const moldOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.75, 1],
    [0.95, 0.55, 0.12, 0]
  );
  const moldScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.12]);
  const moldRotate = useTransform(scrollYProgress, [0, 1], [0, 5]);
  const moldBlur = useTransform(
    scrollYProgress,
    [0, 0.55, 1],
    [
      "blur(1.5px) sepia(0.35) contrast(1.05)",
      "blur(0.5px) sepia(0.12)",
      "blur(0px) sepia(0)",
    ]
  );
  const contentFilter = useTransform(
    scrollYProgress,
    [0, 0.55, 1],
    [
      "blur(3.5px) sepia(0.35) saturate(0.85)",
      "blur(1px) sepia(0.1) saturate(0.95)",
      "blur(0px) sepia(0) saturate(1)",
    ]
  );
  const sporeY = useTransform(scrollYProgress, [0, 1], [0, -22]);
  const sporeOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    [0.45, 0.15, 0]
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
          duration: 1.2,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <motion.div
          className={styles.mold}
          initial={{ opacity: 0.8, scale: 1.02, rotate: 0 }}
          animate={{ opacity: 0, scale: 1.12, rotate: 6 }}
          transition={{ duration: 1.25, delay, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />
        <motion.div
          className={styles.content}
          initial={{ filter: "blur(3.5px) sepia(0.35) saturate(0.85)" }}
          animate={{ filter: "blur(0px) sepia(0) saturate(1)" }}
          transition={{ duration: 1.15, delay, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
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
      }}
    >
      <motion.div
        className={styles.mold}
        style={{
          opacity: moldOpacity,
          scale: moldScale,
          rotate: moldRotate,
          filter: moldBlur,
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
      <motion.div className={styles.content} style={{ filter: contentFilter }}>
        {children}
      </motion.div>
    </motion.div>
  );
}
