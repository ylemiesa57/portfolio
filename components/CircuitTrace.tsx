"use client";

import { useEffect, useState } from "react";
import styles from "./CircuitTrace.module.css";

export interface TraceNode {
  label: string;
  count: number;
}

const NODE_X = [70, 250, 430, 610];
const NODE_Y = [70, 26, 94, 50];
const PATH_LENGTH = 900; // comfortably longer than the rendered path

function buildPath(): string {
  // PCB-style routing: horizontal runs with right-angle elbows between nodes.
  const points: [number, number][] = NODE_X.map((x, i) => [x, NODE_Y[i]]);
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [px] = points[i - 1];
    const [x, y] = points[i];
    const midX = px + (x - px) / 2;
    d += ` L ${midX} ${points[i - 1][1]} L ${midX} ${y} L ${x} ${y}`;
  }
  return d;
}

export default function CircuitTrace({ nodes }: { nodes: TraceNode[] }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const path = buildPath();
  const shown = nodes.slice(0, 4);
  while (shown.length < 4) shown.push({ label: "—", count: 0 });

  return (
    <svg
      className={styles.trace}
      viewBox="0 0 680 120"
      role="img"
      aria-label={`Domains of work: ${shown.map((n) => `${n.label}, ${n.count} repositories`).join("; ")}`}
    >
      <path
        d={path}
        className={styles.wire}
        style={{
          strokeDasharray: PATH_LENGTH,
          strokeDashoffset: armed ? 0 : PATH_LENGTH,
        }}
      />
      {shown.map((node, i) => (
        <g
          key={node.label}
          className={`${styles.node} ${armed ? styles.nodeArmed : ""}`}
          style={{ transitionDelay: `${420 + i * 140}ms` }}
        >
          <circle cx={NODE_X[i]} cy={NODE_Y[i]} r="7" className={styles.nodeRing} />
          <circle cx={NODE_X[i]} cy={NODE_Y[i]} r="3" className={styles.nodeCore} />
          <text
            x={NODE_X[i]}
            y={NODE_Y[i] + (NODE_Y[i] < 60 ? -16 : 24)}
            textAnchor="middle"
            className={styles.label}
          >
            {node.label}
          </text>
          <text
            x={NODE_X[i]}
            y={NODE_Y[i] + (NODE_Y[i] < 60 ? -4 : 36)}
            textAnchor="middle"
            className={styles.count}
          >
            ×{node.count}
          </text>
        </g>
      ))}
    </svg>
  );
}
