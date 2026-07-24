"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useMotionValueEvent,
  useVelocity,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { SECTIONS } from "@/lib/sections";
import styles from "./ScrollBall.module.css";

const BALL = 22;

// Toss feel. Pointer release velocity (px/s) is scaled to scroll-pixels/s by
// (maxScroll / travel); that ratio is large, so a light flick would otherwise
// fling across the whole page. These calm it down.
const TOSS_DAMPING = 0.32; // fraction of release velocity carried into the glide
const TOSS_DECAY = 0.88; // per-60fps-frame velocity retention (lower = stops sooner)
const TOSS_STOP = 14; // px/s below which the glide ends

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

// A throwable scroll handle. The ball reflects your position down the page;
// grab it and the page scrolls to wherever your pointer is on the track,
// carrying a little momentum on release. Section ticks act as targets.
//
// Position is mapped from the pointer's *absolute* location on the track (not
// an accumulating drag delta), so scrolling the page in response can't feed
// back into the gesture and run away.
export default function ScrollBall() {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const draggingRef = useRef(false);
  const momentumRaf = useRef(0);
  // Last pointer sample, for computing release velocity.
  const sample = useRef({ y: 0, t: 0, vel: 0 });

  const [travel, setTravel] = useState(1);
  const [ticks, setTicks] = useState<{ id: string; label: string; pos: number }[]>(
    []
  );
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);

  const { scrollYProgress } = useScroll();

  // Squash & stretch: the ball elongates along its direction of travel and the
  // faster it moves.
  const yVel = useVelocity(y);
  const smoothVel = useSpring(yVel, { stiffness: 320, damping: 28 });
  const scaleY = useTransform(smoothVel, [-2600, 0, 2600], [1.7, 1, 1.7]);
  const scaleX = useTransform(smoothVel, [-2600, 0, 2600], [0.66, 1, 0.66]);
  const fillHeight = useTransform(y, (v) => v + BALL / 2);

  const maxScroll = () =>
    Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  const cancelMomentum = useCallback(() => {
    if (momentumRaf.current) cancelAnimationFrame(momentumRaf.current);
    momentumRaf.current = 0;
  }, []);

  // Measure track height + where each section falls, and sync the ball to the
  // current scroll. Re-runs on resize and once more after fonts/images settle.
  useEffect(() => {
    function measure() {
      const h = trackRef.current?.clientHeight ?? 0;
      const t = Math.max(1, h - BALL);
      setTravel(t);
      const max = maxScroll();
      setTicks(
        SECTIONS.map((s) => {
          const el = document.getElementById(s.id);
          return {
            id: s.id,
            label: s.label,
            pos: Math.min(1, (el?.offsetTop ?? 0) / max),
          };
        })
      );
      y.set((window.scrollY / max) * t);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    const settle = window.setTimeout(measure, 600);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.clearTimeout(settle);
    };
  }, [y]);

  // Scroll → ball. Always mirror the real scroll position, including while we
  // ourselves are driving the scroll during a drag or toss.
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    y.set(p * travel);
  });

  // Active-section label.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = SECTIONS.findIndex((s) => s.id === e.target.id);
            if (i >= 0) setActive(i);
          }
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // A manual wheel/touch scroll should abort any in-flight toss.
  useEffect(() => {
    const stop = () => {
      if (!draggingRef.current) cancelMomentum();
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    return () => {
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    };
  }, [cancelMomentum]);

  // Map an absolute pointer Y to a scroll position (ball centered on pointer).
  const scrollToPointer = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const usable = Math.max(1, rect.height - BALL);
    const ballTop = clientY - rect.top - BALL / 2;
    const p = clamp(ballTop / usable, 0, 1);
    window.scrollTo(0, p * maxScroll());
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (reduce) return;
    e.preventDefault();
    cancelMomentum();
    ballRef.current?.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setDragging(true);
    sample.current = { y: e.clientY, t: performance.now(), vel: 0 };
    scrollToPointer(e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const now = performance.now();
    const dt = Math.max((now - sample.current.t) / 1000, 0.001);
    // Light smoothing so a single jittery sample doesn't dominate the toss.
    const instant = (e.clientY - sample.current.y) / dt;
    sample.current = {
      y: e.clientY,
      t: now,
      vel: sample.current.vel * 0.4 + instant * 0.6,
    };
    scrollToPointer(e.clientY);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    ballRef.current?.releasePointerCapture?.(e.pointerId);
    if (reduce) return;

    // Toss: carry a damped share of the release velocity into a quickly
    // decaying scroll glide.
    const max = maxScroll();
    const cap = max * 1.1;
    let vel = clamp((sample.current.vel / travel) * max * TOSS_DAMPING, -cap, cap);
    let cur = window.scrollY;
    let last = performance.now();
    const stepFn = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      vel *= Math.pow(TOSS_DECAY, dt * 60);
      cur += vel * dt;
      if (cur <= 0) { cur = 0; vel = 0; }
      if (cur >= max) { cur = max; vel = 0; }
      window.scrollTo(0, cur);
      momentumRaf.current =
        Math.abs(vel) > TOSS_STOP ? requestAnimationFrame(stepFn) : 0;
    };
    if (Math.abs(vel) > TOSS_STOP)
      momentumRaf.current = requestAnimationFrame(stepFn);
  };

  // Keyboard fallback (pointer drag isn't reachable by keyboard).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const max = maxScroll();
    const page = window.innerHeight * 0.9;
    const map: Record<string, number> = {
      ArrowUp: -80,
      ArrowDown: 80,
      PageUp: -page,
      PageDown: page,
      Home: -max,
      End: max,
    };
    if (e.key in map) {
      e.preventDefault();
      cancelMomentum();
      window.scrollTo({
        top: clamp(window.scrollY + map[e.key], 0, max),
        behavior: "smooth",
      });
    }
  };

  const progressNow = travel > 0 ? y.get() / travel : 0;

  return (
    <div className={styles.wrap}>
      <div ref={trackRef} className={styles.track}>
        <motion.div className={styles.fill} style={{ height: fillHeight }} />

        {ticks.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className={i === active ? styles.tickOn : styles.tick}
            style={{ top: `${t.pos * 100}%` }}
            aria-label={`Go to ${t.label}`}
            onClick={() => {
              cancelMomentum();
              document
                .getElementById(t.id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        ))}

        <motion.div
          className={`${styles.label} ${dragging ? styles.labelOn : ""}`}
          style={{ y }}
        >
          {SECTIONS[active]?.label}
        </motion.div>

        <motion.div
          ref={ballRef}
          className={styles.ball}
          style={{ y, scaleX: reduce ? 1 : scaleX, scaleY: reduce ? 1 : scaleY }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="slider"
          aria-label="Scroll position — drag or use arrow keys"
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressNow * 100)}
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          <span className={styles.core} />
        </motion.div>
      </div>
    </div>
  );
}
