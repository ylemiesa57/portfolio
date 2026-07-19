import { GithubEvent } from "@/lib/github";
import styles from "./ActivitySignal.module.css";

const DAYS = 21;
const WIDTH = 640;
const HEIGHT = 90;
const BASELINE = HEIGHT - 14;
const MAX_AMPLITUDE = 56;

function bucketByDay(events: GithubEvent[]): number[] {
  const counts = new Array(DAYS).fill(0);
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  for (const event of events) {
    const created = new Date(event.created_at);
    const diffDays = Math.floor((now.getTime() - created.getTime()) / 86_400_000);
    if (diffDays >= 0 && diffDays < DAYS) {
      counts[DAYS - 1 - diffDays] += 1;
    }
  }
  return counts;
}

function buildPolyline(counts: number[]): string {
  const max = Math.max(1, ...counts);
  const step = WIDTH / (DAYS - 1);
  return counts
    .map((count, i) => {
      const x = i * step;
      const y = BASELINE - (count / max) * MAX_AMPLITUDE;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function ActivitySignal({ events }: { events: GithubEvent[] }) {
  const counts = bucketByDay(events);
  const total = counts.reduce((a, b) => a + b, 0);
  const points = buildPolyline(counts);

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Signal</h2>
      </div>
      <p className={styles.sub}>
        Public push/PR/review activity over the last {DAYS} days. Private MIT
        and NASA work doesn&apos;t register here — it&apos;s the visible part
        of a bigger trace.
      </p>

      <div className={styles.scope}>
        <svg
          className={styles.trace}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${total} public GitHub events in the last ${DAYS} days`}
        >
          <line
            x1="0"
            y1={BASELINE}
            x2={WIDTH}
            y2={BASELINE}
            stroke="var(--line-cyan-dim)"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
          <polyline
            points={points}
            fill="none"
            stroke="var(--signal-amber)"
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <div className={styles.readout}>
          <span>
            <b>{total}</b> public event{total === 1 ? "" : "s"} · last {DAYS}d
          </span>
          <span>ylemiesa57 / public timeline</span>
        </div>
      </div>
    </section>
  );
}
