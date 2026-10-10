"use client";

import { useEffect, useRef, useState } from "react";
import type { GEdge, GNode } from "@/lib/graph-types";
import styles from "./site.module.css";

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Held at the spawn point until its turn to appear. */
  held: boolean;
}

type Frame = Record<string, { x: number; y: number }>;

// Milliseconds between one node appearing and the next: the graph builds
// itself rather than arriving whole.
const REVEAL_MS = 110;
const MARGIN = 44;

function truncate(s: string, n = 22) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/**
 * The subgraph the answer was written from, as a live force-directed
 * network beside it: the vector hits are the filled nodes, their neighbours
 * the open ones. Nodes can be dragged; a press that doesn't move opens the
 * page the node belongs to. The simulation rests once it has settled and
 * wakes on a drag or a resize.
 */
export default function Graph({
  nodes,
  edges,
  seedIds,
  onOpen,
}: {
  nodes: GNode[];
  edges: GEdge[];
  seedIds: string[];
  onOpen: (node: GNode) => void;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [revealed, setRevealed] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [frame, setFrame] = useState<Frame>({});

  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const bodies = useRef<Map<string, Body>>(new Map());
  const drag = useRef<{ id: string; moved: boolean } | null>(null);
  const wake = useRef<() => void>(() => {});

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ready = size.w > 0 && size.h > 0;

  // Nodes appear one at a time, each kicked up out of the lower left, where
  // the question was asked. Reduced motion places them all at once.
  useEffect(() => {
    if (!ready || revealed >= nodes.length) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(
      () => {
        const upTo = still ? nodes.length : revealed + 1;
        for (let i = revealed; i < upTo; i++) {
          const b = bodies.current.get(nodes[i].id);
          if (!b) continue;
          b.held = false;
          b.vx = 2 + Math.random() * 3;
          b.vy = -3 - Math.random() * 2;
        }
        setRevealed(upTo);
        wake.current();
      },
      still ? 0 : REVEAL_MS
    );
    return () => window.clearTimeout(t);
  }, [ready, revealed, nodes]);

  useEffect(() => {
    if (!ready) return;
    const { w, h } = size;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (const n of nodes) {
      if (bodies.current.has(n.id)) continue;
      bodies.current.set(n.id, {
        x: MARGIN + Math.random() * 8,
        y: h - MARGIN - Math.random() * 8,
        vx: 0,
        vy: 0,
        held: true,
      });
    }
    const links = edges.filter((e) => e.src !== e.dst);
    // Springs and repulsion scale with the box so the graph fills it.
    const rest = Math.max(90, Math.min(w, h) * 0.34);
    const push = rest * rest * 0.55;

    const step = (): number => {
      const live = [...bodies.current.entries()].filter(([, b]) => !b.held);
      for (let i = 0; i < live.length; i++) {
        for (let j = i + 1; j < live.length; j++) {
          const a = live[i][1];
          const b = live[j][1];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) {
            dx = Math.random() - 0.5;
            dy = Math.random() - 0.5;
            d2 = 1;
          }
          const d = Math.sqrt(d2);
          const f = (push / d2) * 0.9;
          a.vx -= (dx / d) * f;
          a.vy -= (dy / d) * f;
          b.vx += (dx / d) * f;
          b.vy += (dy / d) * f;
        }
      }
      for (const e of links) {
        const a = bodies.current.get(e.src);
        const b = bodies.current.get(e.dst);
        if (!a || !b || a.held || b.held) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = (d - rest) * 0.012;
        a.vx += (dx / d) * f;
        a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f;
        b.vy -= (dy / d) * f;
      }
      let energy = 0;
      for (const [id, b] of live) {
        if (drag.current?.id === id) continue;
        b.vx += (w / 2 - b.x) * 0.004;
        b.vy += (h / 2 - b.y) * 0.004;
        b.vx *= 0.84;
        b.vy *= 0.84;
        b.x = Math.max(MARGIN * 1.5, Math.min(w - MARGIN * 1.5, b.x + b.vx));
        b.y = Math.max(MARGIN / 2, Math.min(h - MARGIN * 1.4, b.y + b.vy));
        energy += b.vx * b.vx + b.vy * b.vy;
      }
      return energy;
    };

    const publish = () => {
      const snap: Frame = {};
      bodies.current.forEach((b, id) => (snap[id] = { x: b.x, y: b.y }));
      setFrame(snap);
    };

    let raf = 0;
    let running = false;
    const tick = () => {
      const energy = step();
      publish();
      if (energy > 0.02 || drag.current) raf = requestAnimationFrame(tick);
      else running = false;
    };
    wake.current = () => {
      if (still) {
        for (let i = 0; i < 400; i++) step();
        publish();
        return;
      }
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    wake.current();
    return () => {
      cancelAnimationFrame(raf);
      wake.current = () => {};
    };
  }, [ready, size, nodes, edges]);

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const b = bodies.current.get(d.id);
    const ctm = svg.current?.getScreenCTM();
    if (!b || !ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    if (Math.hypot(p.x - b.x, p.y - b.y) > 3) d.moved = true;
    b.x = p.x;
    b.y = p.y;
    b.vx = 0;
    b.vy = 0;
  };

  const shown = new Set(nodes.slice(0, revealed).map((n) => n.id));
  const seeds = new Set(seedIds);

  return (
    <figure ref={wrap} className={styles.graph}>
      <figcaption className={styles.graphNote}>
        {nodes.length} nodes · {edges.length} edges · filled nodes matched the question
      </figcaption>
      {ready ? (
        <svg ref={svg} viewBox={`0 0 ${size.w} ${size.h}`} onPointerMove={onPointerMove}>
          {edges.map((e, i) => {
            const a = frame[e.src];
            const b = frame[e.dst];
            if (!a || !b || !shown.has(e.src) || !shown.has(e.dst)) return null;
            const lit = hovered === e.src || hovered === e.dst;
            return (
              <line
                key={`${e.src}-${e.rel}-${e.dst}-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={styles.graphEdge}
                data-lit={lit ? "" : undefined}
              />
            );
          })}
          {nodes.map((n) => {
            const p = frame[n.id];
            if (!p || !shown.has(n.id)) return null;
            const seed = seeds.has(n.id);
            return (
              <g
                key={n.id}
                className={styles.graphNode}
                data-seed={seed ? "" : undefined}
                transform={`translate(${p.x} ${p.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${n.type}: ${n.label}. Open its page.`}
                onPointerDown={(e) => {
                  (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                  drag.current = { id: n.id, moved: false };
                  wake.current();
                }}
                onPointerUp={() => {
                  const d = drag.current;
                  drag.current = null;
                  // A press that never really moved is a click, not a drag.
                  if (d && !d.moved) onOpen(n);
                }}
                onPointerCancel={() => (drag.current = null)}
                onPointerEnter={() => setHovered(n.id)}
                onPointerLeave={() => setHovered(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(n);
                  }
                }}
              >
                <circle r={18} className={styles.graphHit} />
                <circle r={seed ? 6.5 : 5} className={styles.graphDot} />
                <text y={seed ? 23 : 21} textAnchor="middle">
                  {truncate(n.label)}
                </text>
              </g>
            );
          })}
        </svg>
      ) : null}
    </figure>
  );
}
