import { getRouteMeta, type RouteMeta } from "./meta";
import { getDocPage } from "@/pages/docs/registry";

export function resolveMetaForPath(pathname: string): RouteMeta {
  const base = getRouteMeta(pathname);

  if (pathname === "/docs" || pathname.startsWith("/docs/")) {
    const slug = pathname === "/docs" ? undefined : pathname.slice("/docs/".length);
    const page = getDocPage(slug);
    if (page) {
      return { ...base, title: `${page.title} - Hvsna Docs`, description: page.description ?? base.description };
    }
    return { ...base, title: "Not Found - Hvsna Docs" };
  }

  return base;
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function metaToHeadHtml(meta: RouteMeta): string {
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    meta.keywords ? `<meta name="keywords" content="${esc(meta.keywords)}" />` : "",
    `<meta property="og:title" content="${esc(meta.ogTitle ?? meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.ogDescription ?? meta.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${esc(meta.canonical)}" />`,
    meta.ogImage ? `<meta property="og:image" content="${esc(meta.ogImage)}" />` : "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    meta.twitterImage ? `<meta name="twitter:image" content="${esc(meta.twitterImage)}" />` : "",
    `<link rel="canonical" href="${esc(meta.canonical)}" />`,
    meta.hreflang ? `<link rel="alternate" hreflang="en" href="https://hvsna.com${esc(meta.hreflang.en)}" />` : "",
    meta.hreflang ? `<link rel="alternate" hreflang="id" href="https://hvsna.com${esc(meta.hreflang.id)}" />` : "",
  ].filter(Boolean);
  return tags.join("\n    ");
}
