import { useEffect } from "react";
import { useLocation } from "react-router";
import { getRouteMeta, type RouteMeta } from "./meta";

function upsertMeta(attr: "name" | "property", key: string, content: string | undefined) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSeo(override?: Partial<RouteMeta>) {
  const location = useLocation();

  useEffect(() => {
    const base = getRouteMeta(location.pathname);
    const meta: RouteMeta = { ...base, ...override };

    document.title = meta.title;
    upsertMeta("name", "description", meta.description);
    if (meta.keywords) upsertMeta("name", "keywords", meta.keywords);
    upsertMeta("property", "og:title", meta.ogTitle ?? meta.title);
    upsertMeta("property", "og:description", meta.ogDescription ?? meta.description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", meta.canonical);
    if (meta.ogImage) upsertMeta("property", "og:image", meta.ogImage);
    upsertMeta("name", "twitter:card", "summary_large_image");
    if (meta.twitterImage) upsertMeta("name", "twitter:image", meta.twitterImage);
    upsertLink("canonical", meta.canonical);
    if (meta.hreflang) {
      upsertLink("alternate", `https://hvsna.com${meta.hreflang.en}`, "en");
      upsertLink("alternate", `https://hvsna.com${meta.hreflang.id}`, "id");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, override?.title, override?.description]);
}
