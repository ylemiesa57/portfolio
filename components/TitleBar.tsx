import styles from "./TitleBar.module.css";

export default function TitleBar({
  sheet,
  rev,
  drawnBy,
}: {
  sheet: string;
  rev: string;
  drawnBy: string;
}) {
  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <span className={styles.field}>
          <b>SHEET</b> {sheet}
        </span>
        <span className={styles.field}>
          <b>REV.</b> {rev}
        </span>
        <span className={styles.field}>
          <b>DRAWN BY</b> {drawnBy}
        </span>
      </div>
      <span className={styles.mark}>● LIVE FROM GITHUB</span>
    </div>
  );
}
