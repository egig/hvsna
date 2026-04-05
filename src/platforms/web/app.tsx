import { BrowserRouter } from "react-router";
import { AppRoutes } from "src/routes";
import "../../app.css";
import { PouchDBProvider } from "../../pouchdb";
import DroppableContext from "../../modules/components/droppable-context";
import { ScreenSizeProvider } from "../../modules/components/screen-size-wrapper";
import type {
  Coordinate,
  LocationResolveType,
} from "../../modules/settings/settings";
import { Provider } from "@rollbar/react";
import { PostHogProvider } from "@posthog/react";
import { SyncProvider } from "../../modules/sync/context";
import { LanguageProviderWrapper } from "../../modules/i18n/LanguageProviderWrapper";
import { SnackbarProvider } from "../../modules/components/snackbar-provider";
import { ErrorBoundary } from "../../modules/components/error-boundary";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../modules/query-client";
import { TaskProvider } from "../../modules/task/task-context";
import { ListProvider } from "../../modules/task/list-context";
import { AuthProvider } from "../../modules/auth";
import { SettingsProvider } from "../../modules/settings";
import { SystemProvider } from "../../modules/system";
import { PostHogSessionTracker } from "../../modules/posthog/posthog-session-tracker";
import { PlatformProvider } from "../../modules/platform";
import { EnsureRequiredParams } from "../../modules/components/ensure-required-params";
import log from "../../modules/logger";

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
    // You can add analytics tracking or other logic here
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
                                    <BrowserRouter
                                      basename={config.appBaseName || ""}
                                    >
                                      <PostHogSessionTracker platform="web" />
                                      <AppRoutes />
                                    </BrowserRouter>
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
