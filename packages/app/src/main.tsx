import { createRoot, type Container } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import type { AppConfig } from "@/app";
import App from "@/app";
import { getDatabase, wipeLocalData } from "@/modules/db/database-singleton";
import { importLegacySqlite } from "@/modules/db/legacy-sqlite-import";
import { acquireTabLock } from "@/modules/db/tab-lock";
import { configureLogger } from "@/modules/logger";
import { registerWebImplementations } from "./register";
import log from "@/modules/logger";
import { BrowserRouter } from "react-router";
import { ResponsiveRoutes } from "@/routes";
import { bootstrapApp } from "@/modules/bootstrap";
import { BootScreen } from "@/modules/components/boot-screen";
import { DatabaseLockedOverlay } from "@/modules/db/database-locked-overlay";

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
const database = getDatabase();

configureLogger();

// Paint a placeholder immediately, then gate the real render on bootstrapApp:
// restore the session and (if signed in) run the initial sync first, so the
// app mounts against already-reconciled data instead of flashing empty local
// state that a moment-later sync overwrites.
root.render(<BootScreen />);

// Only one tab runs the app at a time (see tab-lock.ts). While another tab
// holds the lock, show the multi-tab prompt over the boot screen; this tab
// continues on its own once the other one closes.
function renderLockState(state: "locked" | "ready") {
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
}

(async () => {
  await acquireTabLock(renderLockState);
  // Existing installs still have their data in the SQLite/OPFS database older
  // builds used; copy it into IndexedDB before anything reads.
  try {
    await importLegacySqlite(database);
  } catch (error) {
    // The old database stays in place, so the import is retried next load.
    log.error("Importing the legacy SQLite database failed", error);
  }
  const bootstrap = await bootstrapApp(database);

  root.render(
    <App
      config={config}
      database={database}
      platform="web"
      Router={BrowserRouter}
      Routes={ResponsiveRoutes}
      bootstrap={bootstrap}
    />
  );
  // @ts-ignore
  window.__dtMounted = true;

  if (import.meta.env.DEV) {
    // E2E-test-only hook (see e2e/helpers/db-reset.ts) — wipes local
    // storage the same way the in-app "wipe data" settings feature does.
    // Stripped from production builds since import.meta.env.DEV is inlined
    // and dead-code-eliminated by Vite.
    // @ts-ignore
    window.__hvsnaResetLocalData = () => wipeLocalData();
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
