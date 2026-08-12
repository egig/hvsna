import type { ComponentType } from "react";
import meta from "@/content/docs/meta.json";

interface MdxFrontmatter {
  title: string;
  description?: string;
}

interface MdxModule {
  default: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
  frontmatter: MdxFrontmatter;
}

export interface DocPage {
  slug: string;
  title: string;
  description?: string;
  Component: MdxModule["default"];
}

const modules = import.meta.glob<MdxModule>("../../content/docs/*.mdx", { eager: true });

const bySlug = new Map<string, DocPage>();
for (const [path, mod] of Object.entries(modules)) {
  const match = path.match(/([^/]+)\.mdx$/);
  if (!match) continue;
  const slug = match[1];
  bySlug.set(slug, {
    slug,
    title: mod.frontmatter?.title ?? slug,
    description: mod.frontmatter?.description,
    Component: mod.default,
  });
}

// content/docs/meta.json's `pages` list is the intended nav order, but it has
// drifted from the actual .mdx filenames over time — skip entries with no
// matching file, and append any files meta.json doesn't mention.
const orderedSlugs = (meta as { pages: string[] }).pages.filter((slug) => bySlug.has(slug));
for (const slug of bySlug.keys()) {
  if (!orderedSlugs.includes(slug)) orderedSlugs.push(slug);
}

export const docsPages: DocPage[] = orderedSlugs.map((slug) => bySlug.get(slug)!);
export const docsNavTitle = (meta as { title: string }).title;

export function getDocPage(slug: string | undefined): DocPage | undefined {
  return bySlug.get(slug ?? "index");
}
