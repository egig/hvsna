import path from "path";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/hvsna/",
  build: {
    // GitHub Pages serves the committed build from the repo-root docs/ folder.
    outDir: path.resolve(__dirname, "../../docs"),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    { enforce: "pre", ...mdx({
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: "frontmatter" }], remarkGfm],
      rehypePlugins: [rehypeSlug],
    }) },
    tailwindcss(),
    tsconfigPaths(),
  ],
});
