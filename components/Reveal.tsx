import { ReactNode } from "react";
import styles from "./Reveal.module.css";

export default function Reveal({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className={styles.wrap}>
      {children}
    </div>
  );
}
