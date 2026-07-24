"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SECTIONS } from "@/lib/sections";
import SubgraphView from "./SubgraphView";
import type { GNode, GEdge } from "@/lib/graph-types";
import styles from "./Navigator.module.css";

type Status = "idle" | "thinking" | "answered" | "error";

interface Citation {
  id: string;
  label: string;
  type: string;
  sectionId: string;
  url: string | null;
}

const SUGGESTIONS = [
  "Show me the AI and ML work",
  "What has he published?",
  "Any open-source contributions?",
  "How do I get in touch?",
];

// Smooth-scroll to a section and pulse it, so the answer visibly "lands"
// somewhere on the sheet rather than just scrolling silently.
function goToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.remove("nav-flash");
  // reflow so the animation can re-trigger on repeat visits
  void el.offsetWidth;
  el.classList.add("nav-flash");
  window.setTimeout(() => el.classList.remove("nav-flash"), 1400);
}

export default function Navigator() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [answer, setAnswer] = useState("");
  const [target, setTarget] = useState<string | null>(null);
  const [subgraph, setSubgraph] = useState<{ nodes: GNode[]; edges: GEdge[] } | null>(
    null
  );
  const [citations, setCitations] = useState<Citation[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open with a clean slate — reset here rather than in an effect so we never
  // trigger a cascading setState on the open→closed transition.
  const openNav = useCallback(() => {
    setStatus("idle");
    setAnswer("");
    setTarget(null);
    setSubgraph(null);
    setCitations([]);
    setOpen(true);
  }, []);

  // ⌘K / Ctrl+K to summon, Esc to dismiss.
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

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [open]);

  const ask = useCallback(async (q: string) => {
    const question = q.trim();
    if (!question) return;
    setStatus("thinking");
    setAnswer("");
    setTarget(null);
    setSubgraph(null);
    setCitations([]);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setAnswer(data?.error ?? "Something went wrong answering that.");
        return;
      }
      setAnswer(data.answer);
      setTarget(data.section);
      if (data.subgraph?.nodes?.length) setSubgraph(data.subgraph);
      if (Array.isArray(data.citations)) setCitations(data.citations);
      setStatus("answered");
      goToSection(data.section);
    } catch {
      setStatus("error");
      setAnswer("Couldn't reach the navigator. Is the dev server running?");
    }
  }, []);

  const targetLabel = SECTIONS.find((s) => s.id === target)?.label;

  return (
    <>
      <motion.button
        type="button"
        className={styles.launcher}
        onClick={openNav}
        aria-label="Ask the blueprint — natural-language navigation"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 140, damping: 18 }}
        whileHover={reduce ? undefined : { y: -2 }}
        whileTap={reduce ? undefined : { scale: 0.97 }}
      >
        <span className={styles.launcherPulse} aria-hidden="true" />
        <span className={styles.launcherText}>Ask the blueprint</span>
        <kbd className={styles.kbd}>⌘K</kbd>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.scrim}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              className={styles.panel}
              role="dialog"
              aria-modal="true"
              aria-label="Ask the blueprint"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <div className={styles.header}>
                <span className={styles.tag}>NAV / LLM</span>
                <span className={styles.hint}>
                  routed on-device by llama3 · press esc to close
                </span>
              </div>

              <form
                className={styles.inputRow}
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(query);
                }}
              >
                <span className={styles.prompt}>&gt;</span>
                <input
                  ref={inputRef}
                  className={styles.input}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask where something is — “show me the hardware projects”"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  className={styles.go}
                  disabled={status === "thinking" || !query.trim()}
                >
                  {status === "thinking" ? "…" : "Route"}
                </button>
              </form>

              <div className={styles.body}>
                <AnimatePresence mode="wait">
                  {status === "idle" && (
                    <motion.div
                      key="suggestions"
                      className={styles.suggestions}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={styles.chip}
                          onClick={() => {
                            setQuery(s);
                            ask(s);
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {status === "thinking" && (
                    <motion.div
                      key="thinking"
                      className={styles.thinking}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <ScanLine />
                      <span>reading the sheet…</span>
                    </motion.div>
                  )}

                  {(status === "answered" || status === "error") && (
                    <motion.div
                      key="answer"
                      className={
                        status === "error" ? styles.answerError : styles.answer
                      }
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className={styles.answerText}>{answer}</p>

                      {citations.length > 0 && (
                        <div className={styles.citations}>
                          {citations.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className={styles.cite}
                              onClick={() => {
                                goToSection(c.sectionId);
                                setOpen(false);
                              }}
                            >
                              <span className={styles.citeType}>{c.type}</span>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {subgraph && (
                        <SubgraphView
                          nodes={subgraph.nodes}
                          edges={subgraph.edges}
                          seedIds={citations.map((c) => c.id)}
                        />
                      )}

                      {status === "answered" && targetLabel && (
                        <button
                          type="button"
                          className={styles.jump}
                          onClick={() => {
                            if (target) goToSection(target);
                            setOpen(false);
                          }}
                        >
                          ↳ Jump to {targetLabel}
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Sweeping scanline used as the "thinking" affordance — reads as the model
// tracing across the drawing.
function ScanLine() {
  return (
    <span className={styles.scan} aria-hidden="true">
      <motion.span
        className={styles.scanBar}
        animate={{ x: ["-100%", "220%"] }}
        transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
      />
    </span>
  );
}
