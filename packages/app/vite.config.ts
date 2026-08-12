import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // wa-sqlite.mjs locates its .wasm file at runtime via
  // `new URL("wa-sqlite.wasm", import.meta.url)`. If esbuild pre-bundles it
  // into node_modules/.vite/deps/, the .wasm sibling isn't copied there, so
  // that URL 404s — which the dev server's SPA fallback answers with
  // index.html, and WebAssembly.compile() then rejects with "wasm
  // validation error: failed to match magic number" (it got HTML, not the
  // wasm binary). Excluding it from pre-bundling keeps it at its real path.
  optimizeDeps: {
    exclude: ["wa-sqlite"],
  },
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "icon-192-maskable.png",
        "icon-512-maskable.png",
      ],
      manifest: {
        name: "Hvsna",
        short_name: "Hvsna",
        description: "Muslim task app",
        theme_color: "#5A4A7A",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3000000,
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif)$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5,
              },
            },
          },
          {
            urlPattern: /^https?:\/\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5,
              },
            },
          },
        ],
      },
    }),
  ],
});
