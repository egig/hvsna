import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppRoutes } from "src/app-routes";
import "./app.css";
import { PouchDBProvider } from "./pouchdb";
import { NavigationProvider } from "./modules/navigation/context";
import DroppableContext from "./components/droppable-context";
import { LanguageProviderWrapper } from "./components/LanguageProviderWrapper";
import PouchDB from "pouchdb";

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
}

export default function Hvsna({
  config,
  db,
}: {
  config: AppConfig;
  db: PouchDB.Database;
}) {
  return (
    <ClerkProvider publishableKey={config.clerkPublishableKey || ""}>
      <DroppableContext>
        <PouchDBProvider dbInstance={db}>
          <LanguageProviderWrapper>
            <BrowserRouter basename={config.appBaseName || ""}>
              <NavigationProvider>
                <AppRoutes />
              </NavigationProvider>
            </BrowserRouter>
          </LanguageProviderWrapper>
        </PouchDBProvider>
      </DroppableContext>
    </ClerkProvider>
  );
}
