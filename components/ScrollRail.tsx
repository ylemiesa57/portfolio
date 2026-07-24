"use client";

import {
  motion,
  useScroll,
  useSpring,
  useVelocity,
  useTransform,
  useReducedMotion,
} from "motion/react";
import styles from "./ScrollRail.module.css";

// Top-of-screen instrument: a scroll-progress trace. The fill tracks how far
// down you are; its head glows brighter with scroll velocity, so fast flicks
// run "hot." The active-section readout lives on the right-hand dial instead.
export default function ScrollRail() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  const velocity = useVelocity(scrollYProgress);
  const glow = useTransform(velocity, [-2.5, 0, 2.5], [1, 0.15, 1]);
  const glowSpring = useSpring(glow, { stiffness: 200, damping: 40 });

  const fillOpacity = useTransform(glowSpring, [0.15, 1], [0.55, 1]);
  const headLeft = useTransform(progress, (p) => `${p * 100}%`);
  const headGlow = useTransform(
    glowSpring,
    (g) => `0 0 ${6 + g * 16}px rgba(77,255,166,${0.4 + g * 0.5})`
  );

  return (
    <div className={styles.rail} aria-hidden="true">
      <motion.div
        className={styles.fill}
        style={{
          scaleX: reduce ? 1 : progress,
          opacity: reduce ? 0.7 : fillOpacity,
        }}
      />
      <motion.div
        className={styles.head}
        style={{
          left: reduce ? "100%" : headLeft,
          boxShadow: reduce ? "none" : headGlow,
        }}
      />
    </div>
  );
}
