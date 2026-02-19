import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppRoutes } from "src/routes";
import "./app.css";
import { PouchDBProvider } from "./pouchdb";
import DroppableContext from "./components/droppable-context";
import { LanguageProviderWrapper } from "./components/LanguageProviderWrapper";
import { Toaster } from "react-hot-toast";
import { SyncProvider } from "./lib/sync";
import { BreakpointWrapper } from "./components/BreakpointWrapper";
import type { Coordinate, LocationResolveType } from "./lib/types/settings";
import { Provider, ErrorBoundary } from "@rollbar/react";

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
        environment: config.rollbarEnv,
      }}
    >
      <ErrorBoundary>
        <BreakpointWrapper onClose={handleBreakpointClose}>
          <ClerkProvider publishableKey={config.clerkPublishableKey || ""}>
            <DroppableContext>
              <PouchDBProvider dbInstance={db}>
                <SyncProvider>
                  <LanguageProviderWrapper>
                    <BrowserRouter basename={config.appBaseName || ""}>
                      <AppRoutes />
                    </BrowserRouter>
                  </LanguageProviderWrapper>
                </SyncProvider>
              </PouchDBProvider>
            </DroppableContext>
            <Toaster
              containerStyle={{
                bottom: 80,
              }}
              position="bottom-center"
            />
          </ClerkProvider>
        </BreakpointWrapper>
      </ErrorBoundary>
    </Provider>
  );
}
