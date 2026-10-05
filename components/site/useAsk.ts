"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AskEvent, AskPayload, AskStage } from "@/lib/ask";

export type AskStatus = "idle" | "thinking" | "done" | "error" | "cancelled";

export interface StageRecord {
  stage: AskStage;
  status: "start" | "done";
  startedAt: number;
  ms?: number;
  model?: string;
  k?: number;
  hops?: number;
  seeds?: number;
  nodes?: number;
  edges?: number;
}

export interface AskState {
  status: AskStatus;
  question: string;
  stages: StageRecord[];
  warnings: string[];
  result: AskPayload | null;
  error: string | null;
  startedAt: number | null;
  /** Milliseconds since the question was sent; ticks while thinking. */
  elapsedMs: number;
}

const INITIAL: AskState = {
  status: "idle",
  question: "",
  stages: [],
  warnings: [],
  result: null,
  error: null,
  startedAt: null,
  elapsedMs: 0,
};

// The system prompts ask for plain prose, but smaller free-tier models don't
// always comply — strip common markdown markers so a stray "**word**" never
// renders as literal asterisks.
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "");
}

/**
 * Runs a question through /api/ask/stream and exposes every stage as it
 * arrives, so the page can narrate the wait with what is actually happening.
 */
export function useAsk() {
  const [state, setState] = useState<AskState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  // Elapsed clock while thinking: a number that changes, not an animation.
  useEffect(() => {
    if (state.status !== "thinking" || state.startedAt == null) return;
    const started = state.startedAt;
    const t = window.setInterval(() => {
      setState((s) => (s.status === "thinking" ? { ...s, elapsedMs: Date.now() - started } : s));
    }, 250);
    return () => window.clearInterval(t);
  }, [state.status, state.startedAt]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((s) => (s.status === "thinking" ? { ...s, status: "cancelled" } : s));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(INITIAL);
  }, []);

  const run = useCallback(async (raw: string) => {
    const question = raw.trim();
    if (!question) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = Date.now();
    setState({
      status: "thinking",
      question,
      stages: [],
      warnings: [],
      result: null,
      error: null,
      startedAt,
      elapsedMs: 0,
    });

    const handle = (e: AskEvent) => {
      setState((s) => {
        if (e.event === "stage") {
          const stages = [...s.stages];
          const i = stages.findIndex((r) => r.stage === e.stage);
          const rec: StageRecord = {
            stage: e.stage,
            status: e.status,
            startedAt: i >= 0 ? stages[i].startedAt : Date.now(),
            ms: e.ms,
            model: e.model,
            k: e.k,
            hops: e.hops,
            seeds: e.seeds,
            nodes: e.nodes,
            edges: e.edges,
          };
          if (i >= 0) stages[i] = rec;
          else stages.push(rec);
          return { ...s, stages };
        }
        if (e.event === "warning") return { ...s, warnings: [...s.warnings, e.message] };
        if (e.event === "result") {
          const payload = { ...e.payload, answer: stripMarkdown(e.payload.answer ?? "") };
          return { ...s, status: "done", result: payload, elapsedMs: Date.now() - startedAt };
        }
        if (e.event === "error") return { ...s, status: "error", error: e.message, elapsedMs: Date.now() - startedAt };
        return s;
      });
    };

    try {
      const res = await fetch("/api/ask/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question }),
        signal: controller.signal,
      });
      if (!res.body) throw new Error("No response body.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          try {
            handle(JSON.parse(line) as AskEvent);
          } catch {
            // A malformed line is dropped; the stream's final event still lands.
          }
        }
      }
      if (buffer.trim()) {
        try {
          handle(JSON.parse(buffer.trim()) as AskEvent);
        } catch {
          /* ignore */
        }
      }
      setState((s) =>
        s.status === "thinking"
          ? { ...s, status: "error", error: "The stream ended before an answer came back." }
          : s
      );
    } catch (err) {
      if (controller.signal.aborted) return;
      setState((s) => ({
        ...s,
        status: "error",
        error:
          err instanceof Error && err.message
            ? `Couldn't reach the server (${err.message}).`
            : "Couldn't reach the server.",
      }));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  return { state, run, cancel, reset };
}
