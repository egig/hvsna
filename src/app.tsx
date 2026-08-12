import { BrowserRouter } from "react-router";
import "@/app.css";
import { SqliteProvider } from "@/modules/sqlite/context";
import type { SqliteClient } from "@/modules/sqlite/client";
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
import { NetworkProvider } from "./modules/network/context";
import {
  RepositoriesProvider,
  createWebRepositories,
} from "@/modules/repositories-context";
import type React from "react";

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
  sqliteClient,
  platform,
  Router,
  Routes,
}: {
  platform: "web";
  config: AppConfig;
  sqliteClient: SqliteClient;
  Router: typeof BrowserRouter;
  Routes: React.FC;
}) {
  const repositories = createWebRepositories(sqliteClient);

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
            <NetworkProvider>
              <PlatformProvider>
                <SnackbarProvider>
                  <ScreenSizeProvider>
                    <SqliteProvider client={sqliteClient}>
                      <RepositoriesProvider repositories={repositories}>
                        <AuthProvider>
                          <SettingsProvider>
                            <LanguageProviderWrapper>
                              <LocationProvider>
                                <DroppableContext>
                                  <SyncProvider>
                                    <Router>
                                      <TaskProvider>
                                        <PostHogSessionTracker
                                          platform={platform}
                                        />
                                        <Routes />
                                      </TaskProvider>
                                    </Router>
                                  </SyncProvider>
                                </DroppableContext>
                              </LocationProvider>
                            </LanguageProviderWrapper>
                          </SettingsProvider>
                        </AuthProvider>
                      </RepositoriesProvider>
                    </SqliteProvider>
                  </ScreenSizeProvider>
                </SnackbarProvider>
              </PlatformProvider>
            </NetworkProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </EnsureRequiredParams>
    </EnsureRequiredParams>
  );
}
