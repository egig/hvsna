import { StrictMode } from "react";
import { createRoot, type Container } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import type { AppConfig } from "src/app";
import Hvsna from "src/app";
import {
  createRequiredIndexes,
  getPouchDBInstance,
} from "src/lib/pouchdb-singleton";

const config: AppConfig = {
  basePath: import.meta.env.VITE_API_BASE,
  appBaseName: `/`,
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!,
  supabaseURL: import.meta.env.VITE_SUPABASE_URL!,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
};

const root = createRoot(document.getElementById("root") as Container);

// Create singleton PouchDB instance
const db = getPouchDBInstance();

(async () => {
  // console.log((new Clerk()).session?.getToken())
  root.render(<Hvsna config={config} db={db} />);
  // @ts-ignore
  window.__dtMounted = true;
  window.document.title = "HVSNA";
})();

registerSW({
  onOfflineReady() {
    console.log("App ready to work offline");
  },
  onNeedRefresh() {
    console.log("New content available, please refresh");
  },
});
