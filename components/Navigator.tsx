"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import GraphCanvas from "./GraphCanvas";
import type { GNode, GEdge } from "@/lib/graph-types";
import styles from "./Navigator.module.css";

type Status = "idle" | "thinking" | "error";

interface Citation {
  id: string;
  label: string;
  type: string;
  sectionId: string;
  url: string | null;
}

interface GraphState {
  nodes: GNode[];
  edges: GEdge[];
  seedIds: string[];
  answer: string;
}

const SUGGESTIONS = [
  "Show me the AI and ML work",
  "What has he published?",
  "Any open-source contributions?",
  "How do I get in touch?",
];

function goToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.remove("nav-flash");
  void el.offsetWidth;
  el.classList.add("nav-flash");
  window.setTimeout(() => el.classList.remove("nav-flash"), 1400);
}

// The system prompts ask for plain prose, but smaller free-tier models don't
// always comply — strip common markdown markers so a stray "**word**" never
// renders as literal asterisks.
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "");
}

/**
 * Corner navigator. Deliberately non-modal: the bubble cluster lives in the
 * bottom-right corner with no scrim, so the rest of the page stays scrollable
 * and clickable the whole time. Clicking anywhere outside the cluster just
 * closes the cluster and hands focus back to the page.
 *
 * The retrieved graph (GraphCanvas) is separate and *persists* — clicking
 * away doesn't dismiss it. It goes away only via its trash button, or when a
 * new question is routed.
 */
export default function Navigator() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [graph, setGraph] = useState<GraphState | null>(null);
  const [flat, setFlat] = useState<{ answer: string; section: string } | null>(
    null
  );
  const [citations, setCitations] = useState<Citation[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);

  const openNav = useCallback(() => {
    setStatus("idle");
    setError("");
    setOpen(true);
  }, []);

  // ⌘K / Ctrl+K to summon, Esc to dismiss the cluster.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else openNav();
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openNav]);

  // Click-outside closes the cluster only. No scrim is used, so this listener
  // is what gives focus back to the page without ever blocking it.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!clusterRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

  const ask = useCallback(async (q: string) => {
    const question = q.trim();
    if (!question) return;
    // Routing a new question replaces whatever graph is on screen.
    setGraph(null);
    setFlat(null);
    setCitations([]);
    setError("");
    setStatus("thinking");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data?.error ?? "Something went wrong answering that.");
        return;
      }
      const answer = stripMarkdown(data.answer ?? "");
      if (Array.isArray(data.citations)) setCitations(data.citations);
      if (data.subgraph?.nodes?.length) {
        setGraph({
          nodes: data.subgraph.nodes,
          edges: data.subgraph.edges ?? [],
          seedIds: (data.citations ?? []).map((c: Citation) => c.id),
          answer,
        });
        // Routing is done and the graph is taking over the screen, so retire
        // the whole cluster (prompt input + suggestion bubbles) rather than
        // leaving it floating over the network. Reopening it is one click.
        setOpen(false);
        setQuery("");
      } else {
        // No graph context — show the routed answer inline in the cluster.
        setFlat({ answer, section: data.section });
      }
      setStatus("idle");
      if (data.section) goToSection(data.section);
    } catch {
      setStatus("error");
      setError("Couldn't reach the navigator. Is the dev server running?");
    }
  }, []);

  const showBubbles = open && status === "idle" && !flat;

  return (
    <>
      {/* Corner launcher — a quarter-circle that warbles on hover. */}
      <button
        type="button"
        className={styles.launcher}
        onClick={() => (open ? setOpen(false) : openNav())}
        aria-label="Ask the blueprint — natural-language navigation"
        aria-expanded={open}
      >
        <span className={styles.warble} aria-hidden="true" />
        <span className={styles.wave} aria-hidden="true" />
        <span className={styles.launcherInner}>
          <span className={styles.launcherDot} aria-hidden="true" />
          <span className={styles.launcherText}>Ask</span>
        </span>
      </button>

      {/* Floating cluster. pointer-events:none on the wrapper keeps the page
          underneath live; each bubble opts back in. */}
      <div className={styles.cluster} ref={clusterRef}>
        <AnimatePresence>
          {open && (
            <motion.form
              key="prompt"
              className={styles.promptBubble}
              onSubmit={(e) => {
                e.preventDefault();
                ask(query);
              }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.75, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
            >
              <span className={styles.promptLabel}>route?</span>
              <input
                ref={inputRef}
                className={styles.input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ask about the work…"
                autoComplete="off"
                spellCheck={false}
                disabled={status === "thinking"}
              />
              <button
                type="submit"
                className={styles.go}
                disabled={status === "thinking" || !query.trim()}
              >
                route →
              </button>
            </motion.form>
          )}

          {/* Suggestion bubbles orbit the prompt, and vanish while thinking. */}
          {showBubbles &&
            SUGGESTIONS.map((s, i) => (
              <motion.button
                key={s}
                type="button"
                className={`${styles.bubble} ${styles[`bubble${i}`]}`}
                onClick={() => {
                  setQuery(s);
                  ask(s);
                }}
                initial={
                  reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, y: 20 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.06 + i * 0.055,
                }}
              >
                {s}
              </motion.button>
            ))}

          {open && status === "thinking" && (
            <motion.div
              key="thinking"
              className={styles.thinkingBubble}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              <span className={styles.spinner} aria-hidden="true" />
              <span>thinking…</span>
            </motion.div>
          )}

          {open && status === "error" && (
            <motion.div
              key="error"
              className={styles.errorBubble}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}

          {/* Fallback (no graph retrieved): answer shown right in the cluster. */}
          {open && flat && status === "idle" && (
            <motion.div
              key="flat"
              className={styles.flatBubble}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <p className={styles.flatText}>{flat.answer}</p>
              <div className={styles.flatRow}>
                {citations.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={styles.cite}
                    onClick={() => goToSection(c.sectionId)}
                  >
                    {c.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.flatClose}
                  onClick={() => {
                    setFlat(null);
                    setQuery("");
                  }}
                >
                  ask another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dismiss control. Lives here rather than inside GraphCanvas so it can
          sit beside the launcher and above it in the stacking order — inside
          the graph layer it was rendered underneath the launcher wedge and
          was therefore unclickable. */}
      <AnimatePresence>
        {graph && (
          <motion.button
            key="trash"
            type="button"
            className={styles.trash}
            onClick={() => setGraph(null)}
            aria-label="Dismiss the retrieved subgraph and its description"
            title="Clear graph"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, x: 12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, x: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
              <path
                d="M4 7h16M10 4h4M9 7v12m6-12v12M6 7l1 13h10l1-13"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Persistent graph overlay — survives clicking away. */}
      {graph && (
        <GraphCanvas
          key={graph.nodes.map((n) => n.id).join("|")}
          nodes={graph.nodes}
          edges={graph.edges}
          seedIds={graph.seedIds}
          answer={graph.answer}
        />
      )}
    </>
  );
}
