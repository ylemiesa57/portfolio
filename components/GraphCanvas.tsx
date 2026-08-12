"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GNode, GEdge } from "@/lib/graph-types";
import styles from "./GraphCanvas.module.css";

interface Body {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
}

function goToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.remove("nav-flash");
  void el.offsetWidth;
  el.classList.add("nav-flash");
  window.setTimeout(() => el.classList.remove("nav-flash"), 1400);
}

function truncate(s: string, n = 24) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// How long between each node popping into existence, in ms. The graph
// "builds" out of the Ask dock rather than appearing at once.
const REVEAL_MS = 110;

/**
 * The retrieved subgraph, rendered as a live force-directed network that
 * grows out of the Ask dock and then floats over the page.
 *
 * Deliberately NOT a modal: no dimming sheet, pointer-events:none on the
 * wrapper so the drafting-table site underneath stays visible and fully
 * interactive. Only the nodes and answer card opt back into pointer events.
 * The graph is dismissed via the trash button (owned by Navigator) or by
 * routing a new question.
 */
export default function GraphCanvas({
  nodes,
  edges,
  seedIds,
  answer,
}: {
  nodes: GNode[];
  edges: GEdge[];
  seedIds: string[];
  answer: string;
}) {
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [revealed, setRevealed] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  // Rendered snapshot of the simulation. The physics runs against the
  // mutable bodiesRef, but render reads only from this state — refs must
  // not be read during render.
  const [frame, setFrame] = useState<Record<string, { x: number; y: number }>>(
    {}
  );

  const bodiesRef = useRef<Map<string, Body>>(new Map());
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Measure the overlay box (not window.innerWidth) so html { zoom } and
  // the Ask dock's layout still map 1:1 onto SVG user space.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const apply = () =>
      setSize({
        w: Math.max(1, el.clientWidth),
        h: Math.max(1, el.clientHeight),
      });
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);

  // Spawn point: just above the centered Ask dock.
  const origin = useMemo(
    () => ({ x: size.w * 0.5, y: size.h - 88 }),
    [size.w, size.h]
  );

  // Seed every node at the dock. They stay pinned there until revealed.
  useEffect(() => {
    const map = new Map<string, Body>();
    nodes.forEach((n) => {
      map.set(n.id, {
        id: n.id,
        x: origin.x + (Math.random() - 0.5) * 8,
        y: origin.y + (Math.random() - 0.5) * 8,
        vx: 0,
        vy: 0,
        pinned: true,
      });
    });
    bodiesRef.current = map;
    // No setState here on purpose: the rAF loop below publishes the first
    // frame, and `revealed` resets naturally because Navigator gives this
    // component a fresh key per question.
    // origin intentionally omitted: re-seeding on every resize would reset
    // a graph the visitor has already dragged into shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  // Reveal one node at a time so the network visibly builds itself.
  useEffect(() => {
    if (revealed >= nodes.length) return;
    const t = window.setTimeout(() => {
      const n = nodes[revealed];
      const b = bodiesRef.current.get(n?.id);
      if (b) {
        b.pinned = false;
        // Kick it up out of the dock.
        b.vx = (Math.random() - 0.5) * 3.2;
        b.vy = -3.2 - Math.random() * 2.2;
      }
      setRevealed((r) => r + 1);
    }, REVEAL_MS);
    return () => window.clearTimeout(t);
  }, [revealed, nodes]);

  // Force simulation. Runs continuously so the graph keeps breathing and
  // responds to drags.
  useEffect(() => {
    let raf = 0;
    const adjacency = edges
      .map((e) => [e.src, e.dst] as const)
      .filter(([a, b]) => a !== b);

    const tick = () => {
      const bodies = [...bodiesRef.current.values()].filter((b) => !b.pinned);
      const cx = size.w * 0.52;
      const cy = size.h * 0.46;

      // Pairwise repulsion.
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) {
            dx = Math.random() - 0.5;
            dy = Math.random() - 0.5;
            d2 = 1;
          }
          const d = Math.sqrt(d2);
          const f = 46000 / d2;
          const ux = dx / d;
          const uy = dy / d;
          a.vx -= ux * f * 0.0016;
          a.vy -= uy * f * 0.0016;
          b.vx += ux * f * 0.0016;
          b.vy += uy * f * 0.0016;
        }
      }

      // Edge springs.
      const REST = 215;
      for (const [srcId, dstId] of adjacency) {
        const a = bodiesRef.current.get(srcId);
        const b = bodiesRef.current.get(dstId);
        if (!a || !b || a.pinned || b.pinned) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = (d - REST) * 0.0075;
        const ux = dx / d;
        const uy = dy / d;
        a.vx += ux * f;
        a.vy += uy * f;
        b.vx -= ux * f;
        b.vy -= uy * f;
      }

      // Gentle pull toward centre + integrate + keep on screen.
      for (const b of bodies) {
        if (dragRef.current?.id === b.id) continue;
        b.vx += (cx - b.x) * 0.0012;
        b.vy += (cy - b.y) * 0.0012;
        b.vx *= 0.86;
        b.vy *= 0.86;
        b.x += b.vx;
        b.y += b.vy;
        const m = 76;
        b.x = Math.max(m, Math.min(size.w - m, b.x));
        b.y = Math.max(m, Math.min(size.h - m, b.y));
      }

      const snap: Record<string, { x: number; y: number }> = {};
      bodiesRef.current.forEach((b, id) => (snap[id] = { x: b.x, y: b.y }));
      setFrame(snap);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [edges, size.w, size.h]);

  const onPointerDown = useCallback(
    (id: string) => (e: React.PointerEvent) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragRef.current = { id, moved: false };
    },
    []
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const b = bodiesRef.current.get(drag.id);
    if (!b) return;
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const nx = p.x;
    const ny = p.y;
    if (Math.hypot(nx - b.x, ny - b.y) > 3) drag.moved = true;
    b.x = nx;
    b.y = ny;
    b.vx = 0;
    b.vy = 0;
  }, []);

  const onPointerUp = useCallback(
    (node: GNode) => (e: React.PointerEvent) => {
      e.stopPropagation();
      const drag = dragRef.current;
      dragRef.current = null;
      // A press that never really moved counts as a click, not a drag.
      if (drag && !drag.moved) goToSection(node.sectionId);
    },
    []
  );

  const visible = nodes.slice(0, revealed);
  const visibleIds = new Set(visible.map((n) => n.id));

  return (
    <div ref={wrapRef} className={styles.wrap} aria-live="polite">
      <svg
        ref={svgRef}
        className={styles.svg}
        width="100%"
        height="100%"
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="none"
        onPointerMove={onPointerMove}
      >
        <g>
          {edges.map((e, i) => {
            if (!visibleIds.has(e.src) || !visibleIds.has(e.dst)) return null;
            const a = frame[e.src];
            const b = frame[e.dst];
            if (!a || !b) return null;
            const lit =
              hovered !== null && (e.src === hovered || e.dst === hovered);
            return (
              <line
                key={`${e.src}-${e.rel}-${e.dst}-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={lit ? styles.edgeLit : styles.edge}
              />
            );
          })}
        </g>
        <g>
          {visible.map((n) => {
            const b = frame[n.id];
            if (!b) return null;
            const seed = seedIds.includes(n.id);
            const isHot = hovered === n.id;
            return (
              <g
                key={n.id}
                className={styles.node}
                transform={`translate(${b.x}, ${b.y})`}
                onPointerDown={onPointerDown(n.id)}
                onPointerUp={onPointerUp(n)}
                onPointerEnter={() => setHovered(n.id)}
                onPointerLeave={() => setHovered(null)}
                role="button"
                tabIndex={0}
                aria-label={`${n.type}: ${n.label} — drag to move, click to jump to section`}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ")
                    goToSection(n.sectionId);
                }}
              >
                <circle
                  r={seed ? 31 : 23}
                  className={seed ? styles.haloSeed : styles.halo}
                />
                <circle
                  r={seed ? 13 : 9.5}
                  className={seed ? styles.dotSeed : styles.dot}
                />
                <text
                  y={seed ? 34 : 29}
                  textAnchor="middle"
                  className={isHot ? styles.labelHot : styles.label}
                >
                  {truncate(n.label)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <span className={styles.cardTag}>RETRIEVED SUBGRAPH</span>
          <span className={styles.cardCount}>
            {revealed}/{nodes.length} nodes · {edges.length} edges
          </span>
        </div>
        <p className={styles.cardAnswer}>{answer}</p>
        <p className={styles.cardHint}>drag nodes · click one to jump</p>
      </div>
    </div>
  );
}
