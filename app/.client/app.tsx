import { BrowserRouter } from "react-router";
import { AppRoutes } from "./app-routes";

import "./app.css";
import DroppableContext from "./components/droppable-context";
import { DatabaseProvider } from "lib/database";

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
    <DroppableContext>
      <DatabaseProvider db={db}>
        <BrowserRouter basename={config.appBaseName}>
          <AppRoutes />
        </BrowserRouter>
      </DatabaseProvider>
    </DroppableContext>
  );
}
