import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import svg2vectordrawable from "svg2vectordrawable";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const iconsDir = path.join(root, "icons");
const androidOutDir = path.join(root, "android/app/src/main/res/drawable");

const PRESENTATION_ATTRS = ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit"];

function toSnakeCase(slug) {
  return slug.replace(/-/g, "_");
}

// Tabler SVGs put presentation attrs (fill/stroke/...) directly on the root <svg>.
// svg2vectordrawable only propagates those from a wrapping <g> down to child <path>s,
// so move them there and swap `currentColor` for a literal color Android can parse
// (the real color is applied at the call site via Icon()'s tint).
function prepareForAndroid(svgSource) {
  const withoutComments = svgSource.replace(/<!--[\s\S]*?-->/g, "");
  const match = withoutComments.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/);
  if (!match) throw new Error("Could not parse SVG root element");
  const [, rawAttrs, inner] = match;

  const attrs = {};
  const attrRegex = /([\w-]+)\s*=\s*"([^"]*)"/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(rawAttrs))) {
    attrs[attrMatch[1]] = attrMatch[2];
  }

  const groupAttrs = [];
  for (const key of PRESENTATION_ATTRS) {
    if (attrs[key] !== undefined) {
      const value = attrs[key] === "currentColor" ? "#000000" : attrs[key];
      groupAttrs.push(`${key}="${value}"`);
      delete attrs[key];
    }
  }

  const rootAttrs = Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(" ");
  return `<svg ${rootAttrs}><g ${groupAttrs.join(" ")}>${inner}</g></svg>`;
}

async function generateAndroidDrawable(svgSource, slug) {
  const prepped = prepareForAndroid(svgSource);
  const xml = await svg2vectordrawable(prepped);
  writeFileSync(path.join(androidOutDir, `ic_${toSnakeCase(slug)}.xml`), xml);
}

mkdirSync(androidOutDir, { recursive: true });

const svgFiles = readdirSync(iconsDir).filter((file) => file.endsWith(".svg"));

for (const file of svgFiles) {
  const slug = file.replace(/\.svg$/, "");
  const svgSource = readFileSync(path.join(iconsDir, file), "utf-8");
  await generateAndroidDrawable(svgSource, slug);
}

console.log(`Generated ${svgFiles.length} icons -> ${path.relative(root, androidOutDir)}`);
