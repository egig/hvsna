import { BrowserRouter } from "react-router";
import "@/app.css";
import { DatabaseProvider } from "@/modules/db/context";
import type { DbExecutor } from "@/modules/db/executor";
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
import { CompletionGraceProvider } from "@/modules/task/completion-grace-context";
import { AuthProvider, VerifyEmailBanner } from "@/modules/auth";
import { SettingsProvider } from "@/modules/settings";
import { PostHogSessionTracker } from "@/modules/posthog/posthog-session-tracker";
import { EnsureRequiredParams } from "@/modules/components/ensure-required-params";
import { LocationProvider } from "./modules/location/context";
import { PlatformProvider } from "./screens/platform";
import { NetworkProvider } from "./modules/network/context";
import type { BootstrapResult } from "@/modules/bootstrap";
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
  database,
  platform,
  Router,
  Routes,
  bootstrap,
}: {
  platform: "web";
  config: AppConfig;
  database: DbExecutor;
  Router: typeof BrowserRouter;
  Routes: React.FC;
  /** Session + initial-sync results from modules/bootstrap.ts, resolved
   *  before this component ever renders. Optional so tests can skip it. */
  bootstrap?: BootstrapResult;
}) {
  const repositories = createWebRepositories(database);

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
              <SnackbarProvider>
                <ScreenSizeProvider>
                  <PlatformProvider>
                    <DatabaseProvider database={database}>
                      <RepositoriesProvider repositories={repositories}>
                        <AuthProvider initialUser={bootstrap?.user ?? null}>
                          <SettingsProvider>
                            <LanguageProviderWrapper>
                              <LocationProvider>
                                <DroppableContext>
                                  <SyncProvider
                                    initialSync={{
                                      performed:
                                        bootstrap?.initialSyncPerformed ??
                                        false,
                                      lastSyncAt: bootstrap?.lastSyncAt ?? null,
                                    }}
                                  >
                                    {/* Sized to the viewport here (not in Layout/LayoutMobile)
                                      so VerifyEmailBanner can occupy normal flow above the
                                      routed content and have it shrink to fit, instead of
                                      overlapping it. */}
                                    <div className="h-[100dvh] flex flex-col">
                                      <VerifyEmailBanner />
                                      <div className="flex-1 min-h-0">
                                        <Router>
                                          <TaskProvider>
                                            <CompletionGraceProvider>
                                              <PostHogSessionTracker
                                                platform={platform}
                                              />
                                              <Routes />
                                            </CompletionGraceProvider>
                                          </TaskProvider>
                                        </Router>
                                      </div>
                                    </div>
                                  </SyncProvider>
                                </DroppableContext>
                              </LocationProvider>
                            </LanguageProviderWrapper>
                          </SettingsProvider>
                        </AuthProvider>
                      </RepositoriesProvider>
                    </DatabaseProvider>
                  </PlatformProvider>
                </ScreenSizeProvider>
              </SnackbarProvider>
            </NetworkProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </EnsureRequiredParams>
    </EnsureRequiredParams>
  );
}
