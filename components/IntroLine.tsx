"use client";

import { motion, useReducedMotion } from "motion/react";
import styles from "./IntroLine.module.css";

const WORDS = [
  "Hi,",
  "I'm",
  "Yaphet",
  "—",
  "welcome",
  "to",
  "my",
  "workshop.",
];

// A short, one-line animated greeting shown above the name. Words fade and
// settle in left-to-right with a small stagger, terminal-cursor style, in
// keeping with the drafting-sheet/terminal aesthetic used elsewhere on the
// page. Falls back to static text for prefers-reduced-motion.
export default function IntroLine() {
  const reduce = useReducedMotion();

  // Markup must be identical whether or not the visitor prefers reduced
  // motion. useReducedMotion() is false during SSR and true on the client for
  // those users, so returning a different tree here (one sentence vs. one span
  // per word) made the server and client HTML disagree and failed hydration.
  // Render the same spans either way and vary only the transition, which never
  // reaches the DOM.
  return (
    <p className={styles.intro}>
      {WORDS.map((word, i) => (
        <motion.span
          key={i}
          className={styles.word}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : { delay: 0.15 + i * 0.07, duration: 0.38, ease: [0.22, 1, 0.36, 1] }
          }
        >
          {word}
          {i < WORDS.length - 1 ? " " : ""}
        </motion.span>
      ))}
      <motion.span
        className={styles.cursor}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduce ? { duration: 0 } : { delay: 0.15 + WORDS.length * 0.07, duration: 0.2 }}
      />
    </p>
  );
}
