"use client";

import * as React from "react";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useSpring,
} from "motion/react";
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
  const ref = useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();

  // The wire etches itself as the hero scrolls up through the viewport, so the
  // signature is literally drawn by the visitor's scroll. Springed so the tip
  // has a little inertia rather than tracking the wheel 1:1.
  const { scrollYProgress } = useScroll({
    // SVGSVGElement is a valid scroll target at runtime; the types only model
    // HTMLElement, so cast rather than wrap the signature in an extra div.
    target: ref as unknown as React.RefObject<HTMLElement>,
    offset: ["start 0.85", "start 0.15"],
  });
  const drawn = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });
  const pathLength = reduce ? 1 : drawn;
  // Pulse fades in only once the wire is nearly complete. Hoisted so the hook
  // runs unconditionally even when the pulse element itself isn't rendered.
  const pulseOpacity = useTransform(drawn, [0.75, 1], [0, 1]);

  const path = buildPath();
  const shown = nodes.slice(0, 4);
  while (shown.length < 4) shown.push({ label: "—", count: 0 });

  // Each node lights the moment the drawing tip passes its position along the
  // wire. Node i sits at roughly (i+1)/4 of the way down the route.
  const nodeThreshold = (i: number) => (i + 1) / (shown.length + 0.2);

  return (
    <svg
      ref={ref}
      className={styles.trace}
      viewBox="0 0 680 120"
      role="img"
      aria-label={`Domains of work: ${shown
        .map((n) => `${n.label}, ${n.count} repositories`)
        .join("; ")}`}
    >
      {/* Base ghost of the full route, so the empty channel reads as intentional. */}
      <path d={path} className={styles.channel} />

      {/* The wire the visitor draws by scrolling. */}
      <motion.path
        d={path}
        className={styles.wire}
        style={{ pathLength }}
      />

      {/* A pulse of signal running the completed route — the "live" board. */}
      {!reduce && (
        <motion.path
          d={path}
          className={styles.pulse}
          style={{ opacity: pulseOpacity }}
          strokeDasharray="18 882"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -PATH_LENGTH }}
          transition={{ duration: 2.6, ease: "linear", repeat: Infinity }}
        />
      )}

      {shown.map((node, i) => (
        <Node
          key={node.label}
          node={node}
          i={i}
          progress={drawn}
          threshold={nodeThreshold(i)}
          reduce={!!reduce}
        />
      ))}
    </svg>
  );
}

function Node({
  node,
  i,
  progress,
  threshold,
  reduce,
}: {
  node: TraceNode;
  i: number;
  progress: ReturnType<typeof useSpring>;
  threshold: number;
  reduce: boolean;
}) {
  const lit = useTransform(progress, (p) =>
    reduce || p >= threshold ? 1 : 0.32
  );
  const scale = useTransform(progress, (p) =>
    reduce || p >= threshold ? 1 : 0.4
  );

  return (
    <motion.g className={styles.node} style={{ opacity: lit }}>
      <motion.circle
        cx={NODE_X[i]}
        cy={NODE_Y[i]}
        r="7"
        className={styles.nodeRing}
        style={{ scale, transformOrigin: `${NODE_X[i]}px ${NODE_Y[i]}px` }}
      />
      <motion.circle
        cx={NODE_X[i]}
        cy={NODE_Y[i]}
        r="3"
        className={styles.nodeCore}
        style={{ scale, transformOrigin: `${NODE_X[i]}px ${NODE_Y[i]}px` }}
      />
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
    </motion.g>
  );
}
