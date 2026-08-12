import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    env: {
      JWT_SECRET: "test-only-secret-do-not-use-in-production",
      ALLOWED_ORIGINS: "http://localhost:5173",
    },
  },
});
