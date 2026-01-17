import { BrowserRouter } from "react-router";
import { AppRoutes } from "./app-routes";

import "./app.css";
import DroppableContext from "./components/droppable-context";

export interface AppConfig {
  basePath?: string;
  registerInviteLink?: string;
  registerInviteOnly?: boolean;
  searchBase: string;
  cookieDomain: string;
  sessionKey: string;
  clerkPublishableKey: string;
  rollbarAccessToken?: string;
  rollbarEnv?: string;
  authUser: any;
  appBaseName: string;
}

export default function App({ config }: { config: any }) {

  return (
    <DroppableContext>
      <BrowserRouter basename={config.appBaseName}>
        <AppRoutes />
      </BrowserRouter>
    </DroppableContext>
  );
}
