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
      APP_URL: "http://localhost:5173",
      LEMONSQUEEZY_API_KEY: "test-only-api-key",
      LEMONSQUEEZY_STORE_ID: "1",
      LEMONSQUEEZY_VARIANT_ID: "2",
      LEMONSQUEEZY_WEBHOOK_SECRET: "test-only-webhook-secret",
    },
  },
});
