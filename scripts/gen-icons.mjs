import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "@svgr/core";
import svg2vectordrawable from "svg2vectordrawable";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const iconsDir = path.join(root, "icons");
const webOutDir = path.join(root, "packages/app/src/modules/icons/generated");
const androidOutDir = path.join(root, "android/app/src/main/res/drawable");

const PRESENTATION_ATTRS = ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit"];

function toPascalCase(slug) {
  return slug.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join("");
}

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

const webTemplate = (variables, { tpl }) => tpl`
${variables.imports};

export function ${variables.componentName}(${variables.props}) {
  return (${variables.jsx});
}
`;

// Support the `size` shorthand call sites already use (carried over from the
// lucide-react/react-icons convention) by destructuring it out of props and
// using it to override the SVG's default 24x24 dimensions.
function addSizeProp(code, componentName) {
  const signature = `export function ${componentName}(props: SVGProps<SVGSVGElement>) {`;
  if (!code.includes(signature)) throw new Error(`${componentName}: unexpected generated signature`);
  if (!code.includes(" width={24} height={24} ")) throw new Error(`${componentName}: unexpected generated dimensions`);
  return code
    .replace(
      signature,
      `export function ${componentName}({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {`,
    )
    .replace(" width={24} height={24} ", " width={size ?? 24} height={size ?? 24} ");
}

async function generateWebComponent(svgSource, slug) {
  const componentName = `Icon${toPascalCase(slug)}`;
  const code = await transform(
    svgSource,
    {
      plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
      icon: false,
      ref: false,
      typescript: true,
      jsxRuntime: "automatic",
      template: webTemplate,
      // Keep viewBox even though it matches the source width/height — the `size` prop
      // overrides width/height at runtime, so without viewBox there's no coordinate
      // system left to scale into and the icon crops instead of resizing.
      svgoConfig: {
        plugins: [
          { name: "preset-default", params: { overrides: { removeViewBox: false } } },
        ],
      },
    },
    { componentName },
  );
  writeFileSync(path.join(webOutDir, `${slug}.tsx`), addSizeProp(code, componentName));
}

async function generateAndroidDrawable(svgSource, slug) {
  const prepped = prepareForAndroid(svgSource);
  const xml = await svg2vectordrawable(prepped);
  writeFileSync(path.join(androidOutDir, `ic_${toSnakeCase(slug)}.xml`), xml);
}

rmSync(webOutDir, { recursive: true, force: true });
mkdirSync(webOutDir, { recursive: true });
mkdirSync(androidOutDir, { recursive: true });

const svgFiles = readdirSync(iconsDir).filter((file) => file.endsWith(".svg"));

for (const file of svgFiles) {
  const slug = file.replace(/\.svg$/, "");
  const svgSource = readFileSync(path.join(iconsDir, file), "utf-8");
  await generateWebComponent(svgSource, slug);
  await generateAndroidDrawable(svgSource, slug);
}

console.log(`Generated ${svgFiles.length} icons -> ${path.relative(root, webOutDir)}, ${path.relative(root, androidOutDir)}`);
