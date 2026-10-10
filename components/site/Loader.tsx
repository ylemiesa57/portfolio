import styles from "./site.module.css";

// One open loop, drawn pointing up from the centre; the other three are the
// same stroke turned. The upper pair is the larger one.
const PETAL = "M -4 -8 C -17 -16 -15 -42 0 -43 C 14 -42 16 -24 9 -15";

const PETALS: { turn: number; scale: number }[] = [
  { turn: -40, scale: 1 },
  { turn: 40, scale: 1 },
  { turn: 140, scale: 0.72 },
  { turn: -140, scale: 0.72 },
];

/**
 * The first thing on the screen: four open loops turning about their centre
 * while the type loads. The page lifts it away once it is ready (see
 * `data-loading` on the shell); without JavaScript it is never shown.
 */
export default function Loader() {
  return (
    <div className={styles.loader} data-loader="" role="status" aria-label="Loading">
      <svg viewBox="-50 -50 100 100" aria-hidden="true">
        <g className={styles.loaderMark}>
          {PETALS.map((p) => (
            <path key={p.turn} d={PETAL} transform={`rotate(${p.turn}) scale(${p.scale})`} />
          ))}
        </g>
      </svg>
    </div>
  );
}
