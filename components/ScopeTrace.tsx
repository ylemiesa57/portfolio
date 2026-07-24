"use client";

import { useEffect, useRef } from "react";
import { useScroll, useVelocity, useReducedMotion } from "motion/react";
import styles from "./ScopeTrace.module.css";

const W = 1000; // path coordinate width (SVG stretches to full width)
const H = 140;
const MID = H / 2;
const SAMPLES = 140;

// Composite of a few harmonics so the trace reads as a real signal rather than
// a single clean sine. `amp` scales the whole thing; `phase` advances in time.
function wave(x: number, phase: number, amp: number, harmonic = 0): number {
  const t = x / W;
  const base = Math.sin(t * Math.PI * 6 + phase);
  const second = 0.4 * Math.sin(t * Math.PI * 14 - phase * 1.7 + harmonic);
  const third = 0.18 * Math.sin(t * Math.PI * 28 + phase * 0.6);
  return MID + amp * (base + second + third);
}

function buildPath(phase: number, amp: number, harmonic = 0): string {
  let d = "";
  for (let i = 0; i <= SAMPLES; i++) {
    const x = (i / SAMPLES) * W;
    const y = wave(x, phase, amp, harmonic);
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d;
}

export default function ScopeTrace() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  const ch1 = useRef<SVGPathElement>(null);
  const ch2 = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (reduce) {
      // Static, gentle trace — no animation loop.
      ch1.current?.setAttribute("d", buildPath(0, 8));
      ch2.current?.setAttribute("d", buildPath(1.6, 5, 1.2));
      return;
    }

    let raf = 0;
    let phase = 0;
    let amp = 6; // current (smoothed) amplitude
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Scroll velocity (px/s) drives the target amplitude; idle keeps a low
      // hum so the scope is always "live."
      const v = Math.abs(velocity.get());
      const target = 6 + Math.min(v / 45, 46);
      amp += (target - amp) * Math.min(dt * 6, 1); // ease toward target
      phase += dt * (1.6 + Math.min(v / 1400, 3)); // faster scroll = faster sweep

      ch1.current?.setAttribute("d", buildPath(phase, amp));
      ch2.current?.setAttribute("d", buildPath(phase + 1.6, amp * 0.62, 1.2));

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, velocity]);

  return (
    <div className={styles.scope} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        {/* Baseline graticule */}
        <line x1="0" y1={MID} x2={W} y2={MID} className={styles.baseline} />
        {/* Channel 2 (amber), drawn behind */}
        <path ref={ch2} className={styles.ch2} d={buildPath(1.6, 5, 1.2)} />
        {/* Channel 1 (green), primary trace */}
        <path ref={ch1} className={styles.ch1} d={buildPath(0, 6)} />
      </svg>
      <span className={styles.tag}>CH1 · scroll = amplitude</span>
    </div>
  );
}
