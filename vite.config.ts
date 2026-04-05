import path from "path";
import { existsSync, renameSync } from "fs";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
import type { Plugin } from "vite";

function platformDevServer(platformHtml: string): Plugin {
  return {
    name: "platform-dev-server",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === "/" || req.url === "/index.html") {
          req.url = platformHtml;
        }
        next();
      });
    },
  };
}

function normalizeHtmlOutput(outDir: string, platform: string): Plugin {
  return {
    name: "normalize-html-output",
    apply: "build",
    closeBundle() {
      const src = path.resolve(
        __dirname,
        outDir,
        "src/platforms",
        platform,
        "index.html",
      );
      const dest = path.resolve(__dirname, outDir, "index.html");
      if (existsSync(src)) {
        renameSync(src, dest);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const isCapacitor = mode === "capacitor";
  const platformHtml = isCapacitor
    ? "/src/platforms/capacitor/index.html"
    : "/src/platforms/web/index.html";

  return {
    build: {
      outDir: "dist",
      emptyOutDir: true,
      minify: true,
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, platformHtml.slice(1)),
        },
      },
    },
    resolve: {
      alias: {
        ...(isCapacitor && {
          "@src/platforms/web/usePWARefresh": path.resolve(
            __dirname,
            "src/platforms/capacitor/usePWARefresh.ts",
          ),
        }),
      },
    },
    plugins: [
      tailwindcss(),
      tsconfigPaths(),
      normalizeHtmlOutput("dist", isCapacitor ? "capacitor" : "web"),
      platformDevServer(platformHtml),
      ...(!isCapacitor
        ? [
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
                        maxAgeSeconds: 60 * 60,
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
          ]
        : []),
    ],
  };
});
