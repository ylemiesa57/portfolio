import type { CSSProperties, ElementType } from "react";
import styles from "./site.module.css";

/** A word broken into the parts that arrive one at a time: twos and threes. */
function parts(word: string): string[] {
  const letters = Array.from(word);
  const out: string[] = [];
  let i = 0;
  while (i < letters.length) {
    const rest = letters.length - i;
    const size = rest === 4 ? 2 : Math.min(3, rest);
    out.push(letters.slice(i, i + size).join(""));
    i += size;
  }
  return out;
}

/**
 * Text that loads a part of a word at a time. Each part fades in after the
 * one before it; the whole run is capped so long paragraphs don't crawl.
 * It is plain CSS, so it plays without JavaScript, and reduced motion shows
 * the text at once. Assistive tech gets the whole string once; the animated
 * pieces are hidden from it. After the first arrival the page plays the
 * sequence faster (see `.part` in the stylesheet) unless `full` is set.
 */
export default function Reveal({
  text,
  as: Tag = "span",
  className,
  delay = 0,
  step = 22,
  max = 1100,
  full = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  /** Milliseconds before the first part appears. */
  delay?: number;
  /** Milliseconds between parts. */
  step?: number;
  /** Longest the whole run may take, in milliseconds. */
  max?: number;
  /** Keep the unhurried pace even after the first arrival (the Ask answer). */
  full?: boolean;
}) {
  const tokens = text.split(/(\s+)/).filter(Boolean);
  const total = tokens.reduce((n, t) => (/^\s+$/.test(t) ? n : n + parts(t).length), 0);
  const gap = Math.min(step, total > 1 ? max / total : step);
  let i = 0;
  return (
    <Tag className={className} data-full={full ? "" : undefined}>
      <span className={styles.spoken}>{text}</span>
      <span aria-hidden="true">
        {tokens.map((token, t) =>
          /^\s+$/.test(token) ? (
            " "
          ) : (
            <span key={t} className={styles.word}>
              {parts(token).map((part, p) => (
                <span
                  key={p}
                  className={styles.part}
                  style={{ "--d": `${Math.round(delay + i++ * gap)}ms` } as CSSProperties}
                >
                  {part}
                </span>
              ))}
            </span>
          )
        )}
      </span>
    </Tag>
  );
}
