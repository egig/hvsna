import { MemoryRouter } from "react-router";
import { AppRoutes } from "@src/routes";
import "@src/app.css";
import { PouchDBProvider } from "@src/pouchdb";
import DroppableContext from "@src/modules/components/droppable-context";
import { ScreenSizeProvider } from "@src/modules/components/screen-size-wrapper";
import type {
  Coordinate,
  LocationResolveType,
} from "@src/modules/settings/settings";
import { Provider } from "@rollbar/react";
import { PostHogProvider } from "@posthog/react";
import { SyncProvider } from "@src/modules/sync/context";
import { LanguageProviderWrapper } from "@src/modules/i18n/LanguageProviderWrapper";
import { SnackbarProvider } from "@src/modules/components/snackbar-provider";
import { ErrorBoundary } from "@src/modules/components/error-boundary";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@src/modules/query-client";
import { TaskProvider } from "@src/modules/task/task-context";
import { ListProvider } from "@src/modules/task/list-context";
import { AuthProvider } from "@src/modules/auth";
import { SettingsProvider } from "@src/modules/settings";
import { SystemProvider } from "@src/modules/system";
import { PostHogSessionTracker } from "@src/modules/posthog/posthog-session-tracker";
import { PlatformProvider } from "@src/modules/platform";
import { EnsureRequiredParams } from "@src/modules/components/ensure-required-params";
import log from "@src/modules/logger";

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
  locationResolvedAt?: string;
  locationResolveType?: LocationResolveType;
  coordinate?: Coordinate | null;
}

const posthogOptions = {
  api_host: "",
  defaults: "2026-01-30",
} as const;

export default function App({
  config,
  db,
}: {
  config: AppConfig;
  db: PouchDB.Database;
}) {
  const handleBreakpointClose = () => {
    log.info("Breakpoint wrapper closed by user");
  };

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
                <SystemProvider>
                  <ScreenSizeProvider onClose={handleBreakpointClose}>
                    <AuthProvider>
                      <SettingsProvider>
                        <DroppableContext>
                          <PouchDBProvider dbInstance={db}>
                            <SyncProvider>
                              <LanguageProviderWrapper>
                                <TaskProvider>
                                  <ListProvider>
                                    <MemoryRouter>
                                      <PostHogSessionTracker platform="capacitor" />
                                      <AppRoutes />
                                    </MemoryRouter>
                                  </ListProvider>
                                </TaskProvider>
                              </LanguageProviderWrapper>
                            </SyncProvider>
                          </PouchDBProvider>
                        </DroppableContext>
                      </SettingsProvider>
                    </AuthProvider>
                  </ScreenSizeProvider>
                </SystemProvider>
              </SnackbarProvider>
            </PlatformProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </EnsureRequiredParams>
    </EnsureRequiredParams>
  );
}
