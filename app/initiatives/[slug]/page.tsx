import { notFound, redirect } from "next/navigation";
import { initiatives } from "@/lib/content";

export function generateStaticParams() {
  return initiatives.map((item) => ({ slug: item.slug }));
}

/**
 * Initiatives used to have pages of their own. They now open inside the
 * Community view, so old links are sent there, on the right entry.
 */
export default async function InitiativePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!initiatives.some((i) => i.slug === slug)) notFound();
  redirect(`/#community/${slug}`);
}
