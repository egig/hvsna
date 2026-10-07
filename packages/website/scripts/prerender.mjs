import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const serverDir = path.join(distDir, "server");

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

rmSync(serverDir, { recursive: true, force: true });

console.log(`Prerendered ${routes.length} routes.`);
