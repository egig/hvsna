import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppRoutes } from "~/.client/app-routes";
import DroppableContext from "~/.client/components/droppable-context";
import { DatabaseProvider } from "~/lib/database";
import "./app.css";

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
