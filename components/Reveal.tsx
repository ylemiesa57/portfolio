"use client";

import { ReactNode, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import styles from "./Reveal.module.css";

const ROT_INITIAL = {
  opacity: 0,
  y: 56,
  rotate: -2.2,
  scale: 0.95,
  filter: "blur(10px) sepia(0.55) contrast(1.12) saturate(0.7)",
  clipPath:
    "polygon(8% 14%, 28% 4%, 52% 10%, 74% 2%, 94% 16%, 100% 38%, 92% 58%, 98% 78%, 82% 96%, 54% 90%, 30% 100%, 8% 86%, 0% 62%, 4% 36%)",
};

const ROT_CLEAR = {
  opacity: 1,
  y: 0,
  rotate: 0,
  scale: 1,
  filter: "blur(0px) sepia(0) contrast(1) saturate(1)",
  clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
};

function MoldLayer({
  opacity,
  scale,
  rotate,
  sporeY,
  sporeOpacity,
}: {
  opacity: ReturnType<typeof useTransform<number, number>> | number;
  scale?: ReturnType<typeof useTransform<number, number>> | number;
  rotate?: ReturnType<typeof useTransform<number, number>> | number;
  sporeY?: ReturnType<typeof useTransform<number, number>> | number;
  sporeOpacity?: ReturnType<typeof useTransform<number, number>> | number;
}) {
  return (
    <>
      <motion.div
        className={styles.mold}
        style={{ opacity, scale, rotate }}
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
    </>
  );
}

// Scroll-scrubbed "organic rot" reveal: each section starts foxed, blotchy,
// slightly twisted and soft-focused, then clarifies into clean paper as it
// climbs the viewport — like decay running in reverse.
export default function Reveal({
  id,
  children,
  delay = 0,
  mode = "scroll",
}: {
  id: string;
  children: ReactNode;
  delay?: number;
  /** `scroll` = scrubbed by scroll position; `mount` = plays once on load. */
  mode?: "scroll" | "mount";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 92%", "start 36%"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.35, 1], [0, 0.75, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [64, 0]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-2.4, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.945, 1]);
  const filter = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    [
      "blur(10px) sepia(0.55) contrast(1.12) saturate(0.7)",
      "blur(3px) sepia(0.22) contrast(1.05) saturate(0.88)",
      "blur(0px) sepia(0) contrast(1) saturate(1)",
    ]
  );
  const clipPath = useTransform(
    scrollYProgress,
    [0, 0.28, 0.62, 1],
    [
      "polygon(8% 14%, 28% 4%, 52% 10%, 74% 2%, 94% 16%, 100% 38%, 92% 58%, 98% 78%, 82% 96%, 54% 90%, 30% 100%, 8% 86%, 0% 62%, 4% 36%)",
      "polygon(4% 8%, 24% 1%, 50% 5%, 72% 0%, 96% 10%, 100% 32%, 96% 54%, 100% 74%, 86% 96%, 56% 94%, 28% 100%, 4% 90%, 0% 66%, 1% 34%)",
      "polygon(1% 3%, 22% 0%, 48% 2%, 74% 0%, 99% 4%, 100% 28%, 99% 52%, 100% 76%, 92% 98%, 58% 99%, 26% 100%, 2% 94%, 0% 68%, 0% 30%)",
      "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    ]
  );

  const moldOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.85, 1],
    [0.85, 0.45, 0.08, 0]
  );
  const moldScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.2]);
  const moldRotate = useTransform(scrollYProgress, [0, 1], [0, 8]);
  const sporeY = useTransform(scrollYProgress, [0, 1], [0, -28]);
  const sporeOpacity = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [0.55, 0.2, 0]
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
          duration: 1.35,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <motion.div
          className={styles.mold}
          initial={{ opacity: 0.8, scale: 1.04, rotate: 0 }}
          animate={{ opacity: 0, scale: 1.18, rotate: 10 }}
          transition={{ duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={i}
            className={styles.spore}
            initial={{ opacity: 0.5, y: 0 }}
            animate={{ opacity: 0, y: -32 }}
            transition={{
              duration: 1.2,
              delay: delay + 0.1 + i * 0.05,
              ease: "easeOut",
            }}
            aria-hidden
          />
        ))}
        <div className={styles.content}>{children}</div>
      </motion.div>
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
        clipPath,
      }}
    >
      <MoldLayer
        opacity={moldOpacity}
        scale={moldScale}
        rotate={moldRotate}
        sporeY={sporeY}
        sporeOpacity={sporeOpacity}
      />
      <div className={styles.content}>{children}</div>
    </motion.div>
  );
}
