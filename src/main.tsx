import { StrictMode } from "react";
import { createRoot, type Container } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import type { AppConfig } from "src/app";
import Hvsna from "src/app";
import {
  createRequiredIndexes,
  getPouchDBInstance,
} from "src/lib/pouchdb-singleton";
import { configureLogger } from "src/lib/logger";
import log from "./lib/logger";

const config: AppConfig = {
  basePath: import.meta.env.VITE_API_BASE,
  appBaseName: `/`,
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!,
  supabaseURL: import.meta.env.VITE_SUPABASE_URL!,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
  rollbarAccessToken: import.meta.env.VITE_ROLLBAR_ACCESS_TOKEN!,
  rollbarEnv: import.meta.env.VITE_ROLLBAR_ENV!,
  posthogKey: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
  posthogHost: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};

const root = createRoot(document.getElementById("root") as Container);

const db = getPouchDBInstance();

// Configure logger early
configureLogger();

(async () => {
  root.render(<Hvsna config={config} db={db} />);
  // @ts-ignore
  window.__dtMounted = true;
})();

registerSW({
  onOfflineReady() {
    log.info("App ready to work offline");
  },
  onNeedRefresh() {
    log.info("New content available, please refresh");
  },
});
