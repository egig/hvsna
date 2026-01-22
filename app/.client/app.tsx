import { BrowserRouter } from "react-router";
import { AppRoutes } from "./app-routes";

import "./app.css";
import DroppableContext from "./components/droppable-context";
import { DatabaseProvider } from "~/lib/database";
import { ClerkProvider } from "@clerk/clerk-react";

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
}

export default function App({ config, db }: { config: AppConfig, db: any }) {

  return (
    <ClerkProvider publishableKey={config.clerkPublishableKey || ""}>
      <DroppableContext>
        <DatabaseProvider db={db}>
          <BrowserRouter basename={config.appBaseName}>
            <AppRoutes />
          </BrowserRouter>
        </DatabaseProvider>
      </DroppableContext>
    </ClerkProvider>
  );
}
