"use client";

import {
  KeyboardEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { classifyDomain, GithubRepo } from "@/lib/github";
import ProjectCard from "./ProjectCard";
import styles from "./RepoCarousel.module.css";

function circularOffset(index: number, active: number, count: number): number {
  let delta = ((index - active) % count + count) % count;
  if (delta > count / 2) delta -= count;
  return delta;
}

function slotName(offset: number): string {
  if (offset === 0) return "0";
  if (offset === -1) return "-1";
  if (offset === 1) return "1";
  return offset < 0 ? "hide-left" : "hide-right";
}

export default function RepoCarousel({
  repos,
  pinned,
}: {
  repos: GithubRepo[];
  pinned: Set<string>;
}) {
  const count = repos.length;
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerX = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const wheelAcc = useRef(0);
  const wheelLock = useRef(false);

  const go = useCallback(
    (direction: number) => {
      if (count < 2) return;
      setActive((current) => (current + direction + count) % count);
    },
    [count]
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root || count < 2) return;

    const onWheel = (event: WheelEvent) => {
      const horizontal =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.shiftKey
            ? event.deltaY
            : 0;
      if (horizontal === 0) return;
      event.preventDefault();
      wheelAcc.current += horizontal;
      if (wheelLock.current) return;
      if (Math.abs(wheelAcc.current) < 36) return;
      const direction = wheelAcc.current > 0 ? 1 : -1;
      wheelAcc.current = 0;
      wheelLock.current = true;
      go(direction);
      window.setTimeout(() => {
        wheelLock.current = false;
      }, 380);
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [count, go]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerX.current = event.clientX;
    didSwipe.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (pointerX.current == null) return;
    const delta = event.clientX - pointerX.current;
    if (Math.abs(delta) < 56) return;
    didSwipe.current = true;
    pointerX.current = event.clientX;
    go(delta < 0 ? 1 : -1);
  }

  function onPointerUp() {
    pointerX.current = null;
  }

  if (count === 0) return null;

  const canCycle = count > 1;

  return (
    <div
      ref={rootRef}
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label="Project modules"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={(event) => {
        if (!didSwipe.current) return;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className={styles.stage}>
        <svg className={styles.arc} viewBox="0 0 1000 320" aria-hidden="true">
          <path d="M 50 292 Q 500 -10 950 292" />
        </svg>

        {repos.map((repo, index) => {
          const offset = circularOffset(index, active, count);
          const slot = slotName(offset);
          const isCenter = offset === 0;
          const visible = Math.abs(offset) <= 1;

          return (
            <div
              key={repo.id}
              className={styles.slide}
              data-slot={slot}
              aria-hidden={!visible}
              role={!isCenter && visible ? "button" : undefined}
              tabIndex={!isCenter && visible ? 0 : undefined}
              aria-label={!isCenter && visible ? `Show ${repo.name}` : undefined}
              onClick={() => {
                if (didSwipe.current) return;
                if (!isCenter && visible) setActive(index);
              }}
              onKeyDown={(event) => {
                if (!isCenter && visible && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  setActive(index);
                }
              }}
            >
              <ProjectCard
                repo={repo}
                pinned={pinned.has(repo.name)}
                domain={classifyDomain(repo)}
                interactive={isCenter}
              />
            </div>
          );
        })}
      </div>

      {canCycle && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => go(-1)}
            aria-label="Previous projects"
          >
            ←
          </button>
          <div className={styles.dots} role="tablist" aria-label="Carousel position">
            {repos.map((repo, index) => (
              <button
                key={repo.id}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={`Show ${repo.name}`}
                className={`${styles.dot} ${index === active ? styles.dotOn : ""}`}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => go(1)}
            aria-label="Next projects"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
