import styles from "./TitleBar.module.css";

const NAV_LINKS = [
  { href: "#modules", label: "Modules" },
  { href: "#awards", label: "Awards" },
  { href: "#publications", label: "Publications" },
  { href: "#oss", label: "OSS" },
  { href: "#initiatives", label: "Initiatives" },
];

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
      <nav className={styles.nav} aria-label="Section navigation">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} className={styles.navLink}>
            {link.label}
          </a>
        ))}
      </nav>
      <span className={styles.mark}>● LIVE FROM GITHUB</span>
    </div>
  );
}
