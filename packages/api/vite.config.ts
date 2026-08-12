import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // 3000, not 5173 — packages/app's dev server already owns 5173.
  server: { port: 3000 },
  plugins: [reactRouter(), tsconfigPaths()],
});
