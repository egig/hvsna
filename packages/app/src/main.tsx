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
import { bootstrapApp } from "@/modules/bootstrap";
import { BootScreen } from "@/modules/components/boot-screen";
import { DatabaseLockedOverlay } from "@/modules/sqlite/database-locked-overlay";

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

// Paint a placeholder immediately, then gate the real render on bootstrapApp:
// restore the session and (if signed in) run the initial sync first, so the
// app mounts against already-reconciled data instead of flashing empty local
// state that a moment-later sync overwrites.
root.render(<BootScreen />);

// When another tab already holds the exclusive SQLite lock, the worker can't
// open the database and bootstrapApp()'s queries below block indefinitely —
// leaving this tab stuck on the "Initiating…" screen. Surface the multi-tab
// prompt in its place until this tab acquires the lock, at which point
// bootstrap resumes on its own and renders <App />.
let appMounted = false;
const stopWatchingLock = sqliteClient.onLockStateChange((state) => {
  if (appMounted) return;
  root.render(
    state === "locked" ? (
      <>
        <BootScreen />
        <DatabaseLockedOverlay />
      </>
    ) : (
      <BootScreen />
    )
  );
});

(async () => {
  const bootstrap = await bootstrapApp(sqliteClient);
  appMounted = true;
  stopWatchingLock();

  root.render(
    <App
      config={config}
      sqliteClient={sqliteClient}
      platform="web"
      Router={BrowserRouter}
      Routes={ResponsiveRoutes}
      bootstrap={bootstrap}
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
