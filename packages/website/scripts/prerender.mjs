import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.resolve(root, "../../docs");
// The SSR bundle stays inside the workspace so its npm imports resolve; it is
// removed after prerendering. The client build + pages go to the repo-root docs/.
const serverDir = path.join(root, "dist/server");

const template = readFileSync(path.join(distDir, "index.html"), "utf-8");
const entryServerUrl = pathToFileURL(path.join(serverDir, "entry-server.js")).href;
const { render, routes } = await import(entryServerUrl);

for (const routePath of routes) {
  const { html, head } = render(routePath);
  const page = template.replace("<!--app-head-->", head).replace("<!--app-html-->", html);
  const outDir = routePath === "/" ? distDir : path.join(distDir, routePath.slice(1));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "index.html"), page);
}

// GitHub Pages: serve the home page for unknown paths (404.html) and skip Jekyll.
copyFileSync(path.join(distDir, "index.html"), path.join(distDir, "404.html"));
writeFileSync(path.join(distDir, ".nojekyll"), "");

rmSync(path.join(root, "dist"), { recursive: true, force: true });

console.log(`Prerendered ${routes.length} routes.`);
