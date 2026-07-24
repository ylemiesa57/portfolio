"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import type { GNode, GEdge } from "@/lib/graph-types";
import styles from "./SubgraphView.module.css";

const W = 320;
const H = 230;
const CX = W / 2;
const CY = H / 2;

function goToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.remove("nav-flash");
  void el.offsetWidth;
  el.classList.add("nav-flash");
  window.setTimeout(() => el.classList.remove("nav-flash"), 1400);
}

function truncate(s: string, n = 16) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// A small radial rendering of the retrieved subgraph: seeds (the vector hits)
// on an inner ring, their neighbors on an outer ring, edges drawn between.
// Clicking a node scrolls to the section that holds it.
export default function SubgraphView({
  nodes,
  edges,
  seedIds,
}: {
  nodes: GNode[];
  edges: GEdge[];
  seedIds: string[];
}) {
  const positions = useMemo(() => {
    const seeds = nodes.filter((n) => seedIds.includes(n.id));
    const others = nodes.filter((n) => !seedIds.includes(n.id));
    const pos = new Map<string, { x: number; y: number }>();

    const ring = (list: GNode[], radius: number, phase: number) => {
      list.forEach((n, i) => {
        if (list.length === 1 && radius < 40) {
          pos.set(n.id, { x: CX, y: CY });
          return;
        }
        const a = (i / list.length) * Math.PI * 2 + phase;
        pos.set(n.id, {
          x: CX + radius * Math.cos(a),
          y: CY + radius * Math.sin(a),
        });
      });
    };

    ring(seeds, seeds.length === 1 ? 0 : 44, -Math.PI / 2);
    ring(others, 92, -Math.PI / 2 + 0.4);
    return pos;
  }, [nodes, seedIds]);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.tag}>RETRIEVED SUBGRAPH</span>
        <span className={styles.count}>
          {nodes.length} nodes · {edges.length} edges
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label="Retrieved knowledge subgraph">
        <g className={styles.edges}>
          {edges.map((e, i) => {
            const a = positions.get(e.src);
            const b = positions.get(e.dst);
            if (!a || !b) return null;
            return (
              <motion.line
                key={`${e.src}-${e.rel}-${e.dst}-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={styles.edge}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.03 }}
              />
            );
          })}
        </g>
        <g>
          {nodes.map((n, i) => {
            const p = positions.get(n.id);
            if (!p) return null;
            const seed = seedIds.includes(n.id);
            return (
              <motion.g
                key={n.id}
                className={styles.node}
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 18, delay: i * 0.04 }}
                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                onClick={() => goToSection(n.sectionId)}
                role="button"
                tabIndex={0}
                aria-label={`${n.type}: ${n.label} — go to section`}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") goToSection(n.sectionId);
                }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={seed ? 7 : 5}
                  className={seed ? styles.dotSeed : styles.dot}
                />
                <text x={p.x} y={p.y + (seed ? 18 : 15)} textAnchor="middle" className={styles.label}>
                  {truncate(n.label)}
                </text>
              </motion.g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
