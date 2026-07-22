import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { initiatives } from "@/lib/content";
import styles from "./page.module.css";

export function generateStaticParams() {
  return initiatives.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = initiatives.find((i) => i.slug === slug);
  if (!item) return {};
  return {
    title: `${item.name} — Yaphet Lemiesa`,
    description: item.summary,
  };
}

export default async function InitiativePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = initiatives.find((i) => i.slug === slug);
  if (!item) notFound();

  return (
    <article id="page-root" className={styles.page}>
      <div className={styles.bar}>
        <Link href="/" className={styles.back}>
          ← BACK TO PORTFOLIO
        </Link>
        <span className={styles.mark}>LOG ENTRY</span>
      </div>

      <div className={styles.content}>
        <span className={styles.tag}>EXTERNAL</span>
        <h1 className={styles.title}>{item.name}</h1>
        <p className={styles.role}>{item.role}</p>

        <div className={styles.body}>
          {item.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.orgLink}
        >
          Visit {item.name} ↗
        </a>
      </div>
    </article>
  );
}
