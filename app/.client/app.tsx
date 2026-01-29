import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppRoutes } from "~/.client/app-routes";
import DroppableContext from "~/.client/components/droppable-context";
import "./app.css";
import { PouchDBProvider } from "./contexts/PouchDB";
import { NavigationProvider } from "./navigation/contexts/NavigationContext";

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

export default function Hvsna({ config }: { config: AppConfig }) {
  return (
    <ClerkProvider publishableKey={config.clerkPublishableKey || ""}>
      <DroppableContext>
          <PouchDBProvider dbName="hvsna-notes">
            <BrowserRouter basename={config.appBaseName || ""}>
            <NavigationProvider>
              <AppRoutes />
            </NavigationProvider>
            </BrowserRouter>
          </PouchDBProvider>
      </DroppableContext>
    </ClerkProvider>
  );
}
