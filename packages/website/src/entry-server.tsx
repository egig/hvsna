import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "@/app";
import { BASENAME } from "@/config";
import { resolveMetaForPath, metaToHeadHtml } from "@/seo/resolve-head";
import { docsPages } from "@/pages/docs/registry";

// Every route the prerender script (scripts/prerender.mjs) needs to visit.
// Kept here (rather than duplicated in the Node script) so it stays in sync
// with the actual route table and the docs content that's actually present.
export const routes: string[] = [
  "/",
  "/about",
  "/download",
  "/features",
  "/privacy",
  "/terms",
  "/changelog",
  "/id",
  "/id/about",
  "/id/download",
  "/id/features",
  "/id/privacy",
  "/id/terms",
  "/help",
  ...docsPages.filter((page) => page.slug !== "index").map((page) => `/help/${page.slug}`),
];

export function render(url: string): { html: string; head: string } {
  const html = renderToString(
    <StaticRouter location={`${BASENAME}${url}`} basename={BASENAME}>
      <App />
    </StaticRouter>,
  );
  const head = metaToHeadHtml(resolveMetaForPath(url));
  return { html, head };
}
