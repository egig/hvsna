import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppRoutes } from "~/.client/app-routes";
import DroppableContext from "~/.client/components/droppable-context";
import { DatabaseProvider } from "~/lib/database";
import "./app.css";
import { SyncProvider } from "~/lib/sync";

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

export default function App({ config, db }: { config: AppConfig, db: any }) {

  return (
    <ClerkProvider publishableKey={config.clerkPublishableKey || ""}>
      <DroppableContext>
        <DatabaseProvider db={db}>
          <SyncProvider url={config.supabaseURL || ""} publishableKey={config.supabasePublishableKey || ""}>
            <BrowserRouter basename={config.appBaseName || ""}>
              <AppRoutes />
            </BrowserRouter>
          </SyncProvider>
        </DatabaseProvider>
      </DroppableContext>
    </ClerkProvider>
  );
}
