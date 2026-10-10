"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { sectionById, sectionForNode } from "@/lib/sections";
import type { Citation } from "@/lib/ask";
import type { StatusPayload } from "@/app/api/status/route";
import Graph from "./Graph";
import Loader from "./Loader";
import Reveal from "./Reveal";
import { useAsk, type StageRecord } from "./useAsk";
import styles from "./site.module.css";

// ---- What the page is given ---------------------------------------------------

export interface Entry {
  slug: string;
  /** The line in the list. */
  name: string;
  /** Quiet text beside the name in the list. */
  aside?: string;
  /** The line under the name when the entry is open. */
  meta?: string;
  paragraphs: string[];
  links: { label: string; url: string }[];
}

export interface SiteData {
  name: string;
  statement: string;
  facts: { label: string; lines: string[] }[];
  note: string;
  links: { label: string; url: string }[];
  portrait: string;
  research: { statement: string; threads: Entry[] };
  publications: { title: string; authors: string; venue: string; cited?: string; url?: string }[];
  honors: Entry[];
  scholarUrl: string;
  projects: Entry[];
  openSource: Entry[];
  githubUrl: string;
  /** False when GitHub didn't answer and the list came from the record alone. */
  githubOk: boolean;
  experience: Entry[];
  education: string;
  community: Entry[];
}

// ---- Views --------------------------------------------------------------------
// The page never scrolls: the bar at the top switches views in place, and the
// address keeps the view (and the open entry) in its hash so Back works.

type View =
  | "about"
  | "research"
  | "publications"
  | "projects"
  | "opensource"
  | "experience"
  | "community"
  | "ask";

const NAV: { view: View; label: string }[] = [
  { view: "about", label: "About" },
  { view: "research", label: "Research" },
  { view: "publications", label: "Publications" },
  { view: "projects", label: "Projects" },
  { view: "opensource", label: "Open source" },
  { view: "experience", label: "Experience" },
  { view: "community", label: "Community" },
];

// Where a section of the knowledge graph lives on this page.
const VIEW_OF_SECTION: Record<string, View> = {
  hero: "about",
  contact: "about",
  research: "research",
  publications: "publications",
  awards: "experience",
  modules: "projects",
  oss: "opensource",
  experience: "experience",
  initiatives: "community",
};

const VIEWS = new Set<string>([...NAV.map((n) => n.view), "ask"]);

function parseHash(hash: string): { view: View; item: string | null } {
  const [rawView, ...rest] = hash.replace(/^#/, "").split("/");
  // Old links used the section ids; they still land on the right view.
  const view = (VIEWS.has(rawView) ? rawView : (VIEW_OF_SECTION[rawView] ?? "about")) as View;
  const item = rest.length ? decodeURIComponent(rest.join("/")) : null;
  return { view, item };
}

function go(view: View, item?: string | null) {
  window.location.hash = item ? `${view}/${encodeURIComponent(item)}` : view;
}

const subscribeHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

// ---- Pieces -------------------------------------------------------------------

function Out({ href, children }: { href: string; children: React.ReactNode }) {
  const external = /^https?:/.test(href);
  return (
    <a href={href} className={styles.link} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

/**
 * The open entry. The page doesn't scroll, so when an entry is taller than
 * the room it has, it is read a few paragraphs at a time: as many as fit.
 */
function OpenEntry({ entry, onBack }: { entry: Entry; onBack: () => void }) {
  const total = entry.paragraphs.length;
  const [per, setPer] = useState(total);
  const [start, setStart] = useState(0);

  // Measure after each layout: while the stage overflows, show one fewer.
  useEffect(() => {
    const stage = document.getElementById("main");
    if (!stage) return;
    const frame = requestAnimationFrame(() => {
      if (stage.scrollHeight > stage.clientHeight + 1) setPer((n) => Math.max(1, n - 1));
    });
    return () => cancelAnimationFrame(frame);
  }, [per, start, total]);

  // A resized window gets a fresh measurement.
  useEffect(() => {
    // Keep the reader's place; only how many paragraphs fit is in question.
    const again = () => setPer(total);
    window.addEventListener("resize", again);
    return () => window.removeEventListener("resize", again);
  }, [total]);

  const pages = Math.ceil(total / per);
  const page = Math.min(pages, Math.floor(start / per) + 1);
  const atEnd = start + per >= total;

  return (
    <article className={styles.entry}>
      <button type="button" className={styles.back} onClick={onBack}>
        Back to the list
      </button>
      <Reveal as="h2" className={styles.entryName} text={entry.name} step={40} />
      {entry.meta ? <p className={`${styles.meta} ${styles.rise}`}>{entry.meta}</p> : null}
      {entry.paragraphs.slice(start, start + per).map((p, i) => (
        <Reveal
          key={start + i}
          as="p"
          className={styles.prose}
          text={p}
          // Only the first page waits for the heading; later pages start at once.
          delay={start === 0 ? 220 + i * 260 : i * 200}
          step={12}
          max={900}
        />
      ))}
      {pages > 1 ? (
        <p className={styles.pager}>
          <span>
            {page} of {pages}
          </span>
          <button type="button" className={styles.quiet} onClick={() => setStart(atEnd ? 0 : start + per)}>
            {atEnd ? "Start again" : "Continue"}
          </button>
        </p>
      ) : null}
      {entry.links.length ? (
        <p className={`${styles.links} ${styles.rise}`} style={{ animationDelay: "700ms" }}>
          {entry.links.map((l) => (
            <Out key={l.url} href={l.url}>
              {l.label}
            </Out>
          ))}
        </p>
      ) : null}
    </article>
  );
}

/**
 * A list on the left and the open entry on the right. On a phone there is
 * room for one of them: the list, or the entry with a way back.
 */
function Browser({
  view,
  item,
  groups,
  intro,
  outro,
}: {
  view: View;
  item: string | null;
  /** `plain` titles only repeat the bar, so they are kept for assistive tech alone. */
  groups: { title?: string; plain?: boolean; entries: Entry[] }[];
  intro?: React.ReactNode;
  outro?: React.ReactNode;
}) {
  const all = groups.flatMap((g) => g.entries);
  const open = all.find((e) => e.slug === item) ?? all[0];
  if (!open) return <div className={styles.browser}>{intro}</div>;
  let row = 0;
  return (
    <div className={styles.browser} data-open={item ? "" : undefined}>
      <div className={styles.index}>
        {intro}
        {groups.map((g, gi) => (
          <div key={gi} className={styles.group}>
            {g.title ? <h2 className={g.plain ? "visually-hidden" : styles.groupTitle}>{g.title}</h2> : null}
            <ul>
              {g.entries.map((e) => (
                <li key={e.slug} className={styles.rise} style={{ animationDelay: `${120 + row++ * 35}ms` }}>
                  <button
                    type="button"
                    className={styles.row}
                    aria-current={open.slug === e.slug ? "true" : undefined}
                    onClick={() => go(view, e.slug)}
                  >
                    <span className={styles.rowName}>{e.name}</span>
                    {e.aside ? <span className={styles.rowAside}>{e.aside}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {outro}
      </div>

      {/* Keyed on the entry and on whether it is the thing showing, so each
          showing measures its own fit. */}
      <OpenEntry key={`${open.slug}:${item ? "open" : "beside"}`} entry={open} onBack={() => go(view)} />
    </div>
  );
}

const STAGE_LABEL: Record<StageRecord["stage"], string> = {
  embed: "Reading the question",
  retrieve: "Searching the graph of my work",
  generate: "Writing the answer",
  route: "Finding the closest page",
};

function statusNote(status: StatusPayload | null): string | null {
  if (!status) return null;
  if (!status.model.configured) return "The language model isn't configured, so Ask can't answer right now.";
  return null;
}

// ---- The page -----------------------------------------------------------------

export default function Site({ data }: { data: SiteData }) {
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => ""
  );
  const { view, item } = parseHash(hash);
  const { state, run, cancel, reset } = useAsk();
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const input = useRef<HTMLInputElement>(null);
  // The view to go back to when an answer is closed.
  const [returnTo, setReturnTo] = useState<View>("about");
  // Which page of an answer's sources a small screen is showing.
  const [sourcePage, setSourcePage] = useState(0);
  // The unhurried load is for the first arrival; after the first move the
  // same sequence plays quickly.
  const [later, setLater] = useState(false);
  const main = useRef<HTMLElement>(null);
  // The loader holds the screen until the type is in, and for long enough to
  // be seen turning; the arrival sequence waits underneath it.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let alive = true;
    Promise.all([Promise.race([document.fonts.ready, wait(2500)]), wait(1100)]).then(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const moved = () => setLater(true);
    window.addEventListener("hashchange", moved, { once: true });
    return () => window.removeEventListener("hashchange", moved);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s: StatusPayload | null) => alive && setStatus(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Cmd/Ctrl+K puts the caret in the Ask field from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      input.current?.focus();
      return;
    }
    if (view !== "ask") setReturnTo(view);
    setSourcePage(0);
    run(question);
    go("ask");
  };

  const closeAnswer = () => {
    reset();
    setQuestion("");
    go(returnTo);
  };

  // A citation opens the page that proves it, on the entry it names.
  const cite = (c: Pick<Citation, "id" | "type" | "sectionId">) => {
    const target = VIEW_OF_SECTION[sectionForNode(c)] ?? "about";
    const slug = c.id.slice(c.id.indexOf(":") + 1);
    const lists: Partial<Record<View, Entry[]>> = {
      projects: data.projects,
      opensource: data.openSource,
      experience: [...data.experience, ...data.honors],
      community: data.community,
    };
    const match = lists[target]?.find((e) => e.slug === slug);
    go(target, match?.slug);
  };

  const thinking = state.status === "thinking";
  const result = state.result;
  const stage = state.stages[state.stages.length - 1];
  const note = statusNote(status);

  return (
    <div className={styles.shell} data-later={later ? "" : undefined} data-loading={loading ? "" : undefined}>
      <Loader />
      {/* The address's hash names the view, so the skip link moves focus
          itself instead of navigating. */}
      <a
        href="#main"
        className="skip"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <header className={styles.bar}>
        <a
          href="#about"
          className={styles.home}
          onClick={(e) => {
            e.preventDefault();
            go("about");
          }}
        >
          {data.name}
        </a>
        <nav className={styles.nav} aria-label="Pages">
          {NAV.map((n) => (
            <a
              key={n.view}
              href={`#${n.view}`}
              className={styles.navLink}
              aria-current={view === n.view ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(n.view);
              }}
            >
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      <main id="main" ref={main} tabIndex={-1} className={styles.stage} key={view} data-view={view}>
        {view === "about" ? (
          <div className={styles.about}>
            <div>
              <Reveal as="h1" className={styles.name} text={data.name} step={85} max={900} />
              <Reveal as="p" className={styles.statement} text={data.statement} delay={520} step={20} max={1000} />
              <dl className={`${styles.facts} ${styles.rise}`} style={{ animationDelay: "1250ms" }}>
                {data.facts.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>
                      {f.lines.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className={`${styles.links} ${styles.rise}`} style={{ animationDelay: "1500ms" }}>
                {data.links.map((l) => (
                  <Out key={l.url} href={l.url}>
                    {l.label}
                  </Out>
                ))}
              </p>
            </div>
            <figure className={`${styles.portrait} ${styles.rise}`} style={{ animationDelay: "900ms" }}>
              {/* Served as the file itself: the image optimizer route is not
                  reachable behind this project's service rewrites. */}
              <Image src={data.portrait} alt={`Portrait of ${data.name}`} width={400} height={400} priority unoptimized />
            </figure>
          </div>
        ) : null}

        {view === "research" ? (
          <Browser
            view="research"
            item={item}
            groups={[{ entries: data.research.threads }]}
            intro={<Reveal as="p" className={styles.intro} text={data.research.statement} step={12} max={900} />}
          />
        ) : null}

        {view === "publications" ? (
          <section className={styles.papers}>
            <h1 className="visually-hidden">Publications</h1>
            <ol className={styles.pubs}>
              {data.publications.map((p, i) => (
                <li key={p.title}>
                  <Reveal as="h2" className={styles.pubTitle} text={p.title} delay={i * 240} step={14} max={500} />
                  <p className={`${styles.meta} ${styles.rise}`} style={{ animationDelay: `${200 + i * 240}ms` }}>
                    {p.authors}
                  </p>
                  <p className={`${styles.meta} ${styles.rise}`} style={{ animationDelay: `${240 + i * 240}ms` }}>
                    <em>{p.venue}</em>
                    {p.cited ? ` · ${p.cited}` : ""}
                  </p>
                </li>
              ))}
            </ol>
            <p className={`${styles.links} ${styles.rise}`} style={{ animationDelay: "800ms" }}>
              <Out href={data.scholarUrl}>Google Scholar</Out>
            </p>
          </section>
        ) : null}

        {view === "projects" ? (
          <Browser
            view="projects"
            item={item}
            groups={[{ title: "Projects", plain: true, entries: data.projects }]}
            outro={
              <p className={`${styles.meta} ${styles.outro} ${styles.rise}`} style={{ animationDelay: "500ms" }}>
                {data.githubOk ? null : "GitHub didn't answer this hour; this list is from my own notes. "}
                <Out href={data.githubUrl}>Everything else is on GitHub</Out>
              </p>
            }
          />
        ) : null}

        {view === "opensource" ? (
          <Browser
            view="opensource"
            item={item}
            groups={[{ title: "Pull requests to other people's projects", entries: data.openSource }]}
          />
        ) : null}

        {view === "experience" ? (
          <Browser
            view="experience"
            item={item}
            groups={[
              { title: "Experience", entries: data.experience },
              { title: "Honors", entries: data.honors },
            ]}
            outro={
              <p className={`${styles.meta} ${styles.outro} ${styles.rise}`} style={{ animationDelay: "500ms" }}>
                {data.education}
              </p>
            }
          />
        ) : null}

        {view === "community" ? (
          <Browser view="community" item={item} groups={[{ title: "Community", plain: true, entries: data.community }]} />
        ) : null}

        {view === "ask" ? (
          <div className={styles.asked}>
          <div className={styles.answer} aria-live="polite">
            {state.status === "idle" ? (
              <>
                <Reveal as="h1" className={styles.viewTitle} text="Ask" />
                <Reveal as="p" className={styles.prose} text={data.note} delay={150} step={16} />
              </>
            ) : (
              <>
                <h1 className={styles.question}>{state.question}</h1>

                {thinking ? (
                  <p className={styles.meta} key={stage?.stage ?? "sending"}>
                    <Reveal text={`${stage ? STAGE_LABEL[stage.stage] : "Sending the question"}…`} step={18} />
                    <button type="button" className={styles.quiet} onClick={cancel}>
                      Stop
                    </button>
                  </p>
                ) : null}

                {state.status === "done" && result ? (
                  <>
                    <Reveal as="p" className={styles.reply} text={result.answer} step={14} max={1600} full />
                    {result.grounded && result.citations.length ? (
                      <ol
                        className={styles.citations}
                        aria-label="Where this answer came from"
                        data-page={sourcePage}
                      >
                        {result.citations.map((c, i) => (
                          <li key={c.id} className={styles.rise} style={{ animationDelay: `${500 + i * 90}ms` }}>
                            <button type="button" className={styles.citation} onClick={() => cite(c)}>
                              <span>{c.label}</span>
                              <span className={styles.rowAside}>
                                {NAV.find((n) => n.view === VIEW_OF_SECTION[sectionForNode(c)])?.label ?? "About"}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                    {result.grounded && result.citations.length > 3 ? (
                      <p className={`${styles.meta} ${styles.moreSources}`}>
                        <button type="button" className={styles.quiet} onClick={() => setSourcePage(sourcePage ? 0 : 1)}>
                          {sourcePage
                            ? "First three sources"
                            : `${result.citations.length - 3} more ${result.citations.length - 3 === 1 ? "source" : "sources"}`}
                        </button>
                      </p>
                    ) : null}
                    {!result.grounded ? (
                      <p className={styles.meta}>
                        The graph was out of reach, so this points to a page instead of answering from the record.{" "}
                        <button
                          type="button"
                          className={styles.quiet}
                          onClick={() => go(VIEW_OF_SECTION[result.section] ?? "about")}
                        >
                          Open {sectionById(result.section)?.label ?? "it"}
                        </button>
                      </p>
                    ) : null}
                  </>
                ) : null}

                {state.status === "error" ? (
                  <p className={styles.prose}>
                    {state.error ?? "Something went wrong."}{" "}
                    <button type="button" className={styles.quiet} onClick={() => run(state.question)}>
                      Try again
                    </button>
                  </p>
                ) : null}

                {state.status === "cancelled" ? <p className={styles.meta}>Stopped.</p> : null}

                {!thinking ? (
                  <p className={styles.meta}>
                    <button type="button" className={styles.quiet} onClick={closeAnswer}>
                      Close
                    </button>
                  </p>
                ) : null}
              </>
            )}
          </div>
          {state.status === "done" && result?.grounded && result.subgraph ? (
            <Graph
              key={state.question}
              nodes={result.subgraph.nodes}
              edges={result.subgraph.edges}
              seedIds={result.citations.map((c) => c.id)}
              onOpen={cite}
            />
          ) : null}
          </div>
        ) : null}
      </main>

      <footer className={styles.ask}>
        <form className={styles.askForm} onSubmit={ask}>
          <label htmlFor="ask" className="visually-hidden">
            Ask a question about my work
          </label>
          <input
            ref={input}
            id="ask"
            className={styles.askInput}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about my work"
            maxLength={400}
            autoComplete="off"
            enterKeyHint="send"
          />
          <button type="submit" className={styles.askSend} disabled={thinking}>
            Ask
          </button>
        </form>
        {note ? <p className={styles.askNote}>{note}</p> : null}
      </footer>
    </div>
  );
}
