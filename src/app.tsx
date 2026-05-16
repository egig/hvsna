import { BrowserRouter, MemoryRouter } from "react-router";
import { AppRoutes } from "src/routes";
import "@/app.css";
import { PouchDBProvider } from "@/pouchdb";
import DroppableContext from "@/modules/components/droppable-context";
import { ScreenSizeProvider } from "@/modules/components/screen-size-wrapper";
import { Provider } from "@rollbar/react";
import { PostHogProvider } from "@posthog/react";
import { SyncProvider } from "@/modules/sync/context";
import { LanguageProviderWrapper } from "@/modules/i18n/LanguageProviderWrapper";
import { SnackbarProvider } from "@/modules/components/snackbar-provider";
import { ErrorBoundary } from "@/modules/components/error-boundary";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/modules/query-client";
import { TaskProvider } from "@/modules/task/task-context";
import { AuthProvider } from "@/modules/auth";
import { SettingsProvider } from "@/modules/settings";
import { PostHogSessionTracker } from "@/modules/posthog/posthog-session-tracker";
import { PlatformProvider } from "@/modules/platform";
import { EnsureRequiredParams } from "@/modules/components/ensure-required-params";
import { LocationProvider } from "./modules/location/context";

export interface AppConfig {
  basePath?: string;
  registerInviteLink?: string;
  registerInviteOnly?: boolean;
  searchBase?: string;
  cookieDomain?: string;
  sessionKey?: string;
  rollbarAccessToken?: string;
  rollbarEnv?: string;
  posthogKey?: string;
  posthogHost?: string;
  authUser?: any;
  appBaseName?: string;
  supabaseURL?: string;
  supabasePublishableKey?: string;
}

const posthogOptions = {
  api_host: "",
  defaults: "2026-01-30",
} as const;

export default function App({
  config,
  db,
  platform,
  Router,
}: {
  platform: "web" | "capacitor";
  config: AppConfig;
  db: PouchDB.Database;
  Router: typeof BrowserRouter | typeof MemoryRouter;
}) {
  return (
    <EnsureRequiredParams
      component={PostHogProvider}
      required={["apiKey"]}
      props={{
        apiKey: config.posthogKey || "",
        options: {
          ...posthogOptions,
          api_host: config.posthogHost || "https://us.i.posthog.com",
        },
      }}
    >
      <EnsureRequiredParams
        component={Provider}
        props={{
          config: {
            accessToken: config.rollbarAccessToken,
            environment: import.meta.env.MODE,
            code_version: "1.0.0",
            captureUncaught: true,
            captureUnhandledRejections: true,
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <PlatformProvider>
              <SnackbarProvider>
                <ScreenSizeProvider>
                  <PouchDBProvider dbInstance={db}>
                    <AuthProvider>
                      <SettingsProvider>
                        <LocationProvider>
                          <DroppableContext>
                            <SyncProvider>
                              <LanguageProviderWrapper>
                                <Router>
                                  <TaskProvider>
                                    <PostHogSessionTracker
                                      platform={platform}
                                    />
                                    <AppRoutes />
                                  </TaskProvider>
                                </Router>
                              </LanguageProviderWrapper>
                            </SyncProvider>
                          </DroppableContext>
                        </LocationProvider>
                      </SettingsProvider>
                    </AuthProvider>
                  </PouchDBProvider>
                </ScreenSizeProvider>
              </SnackbarProvider>
            </PlatformProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </EnsureRequiredParams>
    </EnsureRequiredParams>
  );
}
