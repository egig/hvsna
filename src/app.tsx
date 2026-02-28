import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppRoutes } from "src/routes";
import "./app.css";
import { PouchDBProvider } from "./pouchdb";
import DroppableContext from "./ui/droppable-context";
import { ScreenSizeProvider } from "./ui/screen-size-wrapper";
import type {
  Coordinate,
  LocationResolveType,
} from "./modules/settings/settings";
import { Provider } from "@rollbar/react";
import { SyncProvider } from "./modules/sync/context";
import { LanguageProviderWrapper } from "./modules/i18n/LanguageProviderWrapper";
import { SnackbarProvider } from "./ui/snackbar-provider";
import { ErrorBoundary } from "./components/error-boundary";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { TaskProvider } from "./modules/task/task-context";
import { AuthProvider } from "./modules/auth";
import { SettingsProvider } from "./modules/settings";
import { SystemProvider } from "./modules/system";

export interface AppConfig {
  basePath?: string;
  registerInviteLink?: string;
  registerInviteOnly?: boolean;
  searchBase?: string;
  cookieDomain?: string;
  sessionKey?: string;
  clerkPublishableKey?: string;
  rollbarAccessToken?: string;
  rollbarEnv?: string;
  authUser?: any;
  appBaseName?: string;
  supabaseURL?: string;
  supabasePublishableKey?: string;
  locationResolvedAt?: string;
  locationResolveType?: LocationResolveType;
  coordinate?: Coordinate | null;
}

export default function Hvsna({
  config,
  db,
}: {
  config: AppConfig;
  db: PouchDB.Database;
}) {
  const handleBreakpointClose = () => {
    console.log("Breakpoint wrapper closed by user");
    // You can add analytics tracking or other logic here
  };

  return (
    <Provider
      config={{
        accessToken: config.rollbarAccessToken,
        environment: import.meta.env.MODE,
        code_version: "1.0.0",
        captureUncaught: true,
        captureUnhandledRejections: true,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <SnackbarProvider>
            <SystemProvider>
              <ScreenSizeProvider onClose={handleBreakpointClose}>
                <ClerkProvider
                  publishableKey={config.clerkPublishableKey || ""}
                >
                  <AuthProvider>
                    <SettingsProvider>
                      <DroppableContext>
                        <PouchDBProvider dbInstance={db}>
                          <SyncProvider>
                            <LanguageProviderWrapper>
                              <TaskProvider>
                                <BrowserRouter
                                  basename={config.appBaseName || ""}
                                >
                                  <AppRoutes />
                                </BrowserRouter>
                              </TaskProvider>
                            </LanguageProviderWrapper>
                          </SyncProvider>
                        </PouchDBProvider>
                      </DroppableContext>
                    </SettingsProvider>
                  </AuthProvider>
                </ClerkProvider>
              </ScreenSizeProvider>
            </SystemProvider>
          </SnackbarProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </Provider>
  );
}
