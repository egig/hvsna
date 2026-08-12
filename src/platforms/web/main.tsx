import { createRoot, type Container } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import type { AppConfig } from "@/app";
import App from "@/app";
import { getSqliteClient } from "@/modules/sqlite/sqlite-singleton";
import { configureLogger } from "@/modules/logger";
import { registerWebImplementations } from "./register";
import log from "@/modules/logger";
import { BrowserRouter } from "react-router";
import { ResponsiveRoutes } from "@/routes";

registerWebImplementations();

const config: AppConfig = {
  basePath: import.meta.env.VITE_API_BASE,
  appBaseName: `/`,
  supabaseURL: import.meta.env.VITE_SUPABASE_URL!,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
  rollbarAccessToken: import.meta.env.VITE_ROLLBAR_ACCESS_TOKEN!,
  rollbarEnv: import.meta.env.VITE_ROLLBAR_ENV!,
  posthogKey: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
  posthogHost: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};

const root = createRoot(document.getElementById("root") as Container);
const sqliteClient = getSqliteClient();

configureLogger();

(async () => {
  root.render(
    <App
      config={config}
      sqliteClient={sqliteClient}
      platform="web"
      Router={BrowserRouter}
      Routes={ResponsiveRoutes}
    />
  );
  // @ts-ignore
  window.__dtMounted = true;

  if (import.meta.env.DEV) {
    // E2E-test-only hook (see e2e/helpers/db-reset.ts) — wipes local SQLite
    // storage the same way the in-app "wipe data" settings feature does.
    // Stripped from production builds since import.meta.env.DEV is inlined
    // and dead-code-eliminated by Vite.
    // @ts-ignore
    window.__hvsnaResetLocalData = () => sqliteClient.wipe();
  }
})();

registerSW({
  onOfflineReady() {
    log.info("App ready to work offline");
  },
  onNeedRefresh() {
    log.info("New content available, please refresh");
  },
});
