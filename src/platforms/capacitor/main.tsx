import { createRoot, type Container } from "react-dom/client";
import type { AppConfig } from "./app";
import App from "./app";
import { getPouchDBInstance } from "@/modules/pouchdb-singleton";
import { configureLogger } from "@/modules/logger";
import { registerCapacitorImplementations } from "./register";

registerCapacitorImplementations();

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
  root.render(<App config={config} db={db} />);
  // @ts-ignore
  window.__dtMounted = true;
})();
