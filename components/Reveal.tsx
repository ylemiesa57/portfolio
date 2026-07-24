"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

// Wraps a section so it settles into place as it scrolls into view: a small
// rise + fade with a spring, like a part being placed onto the board. The
// wrapper is a full-width block, transparent to the page's vertical stack, and
// carries the anchor id the navigator scrolls to.
export default function Reveal({
  id,
  children,
  delay = 0,
}: {
  id: string;
  children: ReactNode;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      id={id}
      style={{ scrollMarginTop: "84px" }}
      initial={reduce ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 20,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
