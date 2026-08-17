"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import styles from "./TraceBridge.module.css";

/**
 * Scroll-driven "wiring" between the hero and the projects grid.
 *
 * Blueprint traces draw downward out of the hero as you scroll toward the
 * projects section, then the project cards power on in sequence as the traces
 * land. GSAP's ScrollTrigger drives it rather than motion's useScroll because
 * this is a scrubbed timeline -- progress is tied to scroll position frame by
 * frame, and the card power-on has to be sequenced against that same timeline
 * rather than fired on an intersection callback.
 *
 * GSAP and its plugin are imported dynamically inside the effect so they stay
 * out of the server bundle and off the critical path; nothing here runs until
 * the component has mounted in a browser.
 */
export default function TraceBridge() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    // Respect the user's motion preference: draw the traces in their finished
    // state and skip the scrubbing entirely.
    const root = rootRef.current;
    if (!root) return;

    const paths = Array.from(root.querySelectorAll<SVGPathElement>("path[data-trace]"));
    const cards = () =>
      Array.from(document.querySelectorAll<HTMLElement>("#modules [data-project-card]"));

    if (reduce) {
      paths.forEach((p) => {
        p.style.strokeDasharray = "none";
        p.style.strokeDashoffset = "0";
        p.style.opacity = "1";
      });
      cards().forEach((c) => (c.style.opacity = "1"));
      return;
    }

    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        // Prime each trace as an undrawn line.
        paths.forEach((p) => {
          const len = p.getTotalLength();
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
        });
        gsap.set(cards(), { opacity: 0.18, y: 14 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top 85%",
            end: "bottom 45%",
            scrub: 0.6,
          },
        });

        tl.to(paths, {
          strokeDashoffset: 0,
          duration: 1,
          ease: "none",
          stagger: 0.08,
        });

        // Cards power on once the traces reach them.
        tl.to(
          cards(),
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.05 },
          ">-0.35"
        );
      }, root);

      cleanup = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [reduce]);

  return (
    <div className={styles.bridge} ref={rootRef} aria-hidden="true">
      <svg className={styles.svg} viewBox="0 0 1200 200" preserveAspectRatio="none">
        {/* Traces fan out of the hero and run down into the grid below. */}
        <path data-trace d="M 600 0 L 600 60 L 160 60 L 160 200" />
        <path data-trace d="M 600 0 L 600 60 L 420 60 L 420 200" />
        <path data-trace d="M 600 0 L 600 200" />
        <path data-trace d="M 600 0 L 600 60 L 800 60 L 800 200" />
        <path data-trace d="M 600 0 L 600 60 L 1050 60 L 1050 200" />
      </svg>
    </div>
  );
}
