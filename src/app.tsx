import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppRoutes } from "src/routes";
import "./app.css";
import { PouchDBProvider } from "./pouchdb";
import DroppableContext from "./ui/droppable-context";
import { Toaster } from "react-hot-toast";
import { ScreenSizeProvider } from "./ui/screen-size-wrapper";
import type {
  Coordinate,
  LocationResolveType,
} from "./modules/settings/settings";
import { Provider, ErrorBoundary } from "@rollbar/react";
import { SyncProvider } from "./modules/sync/context";
import { LanguageProviderWrapper } from "./modules/i18n/LanguageProviderWrapper";

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
        <ScreenSizeProvider onClose={handleBreakpointClose}>
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
        </ScreenSizeProvider>
      </ErrorBoundary>
    </Provider>
  );
}
