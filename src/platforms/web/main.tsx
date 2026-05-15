import { createRoot, type Container } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import type { AppConfig } from "@/app";
import App from "@/app";
import { getPouchDBInstance } from "@/modules/pouchdb-singleton";
import { configureLogger } from "@/modules/logger";
import { registerWebImplementations } from "./register";
import log from "@/modules/logger";
import { BrowserRouter } from "react-router";

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
const db = getPouchDBInstance();

configureLogger();

(async () => {
  root.render(
    <App config={config} db={db} platform="web" Router={BrowserRouter} />
  );
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
