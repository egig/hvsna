import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppRoutes } from "~/.client/app-routes";
import DroppableContext from "~/.client/components/droppable-context";
import "framework7-icons";
import "framework7/css/bundle";
import "./app.css";
import { SyncProvider } from "~/lib/sync";
import { App, View, Views } from "framework7-react";
import TabsPage from "./pages/tabs";
import ViewToday from "./pages/view-today";
import Settings from "./pages/settings";
import Template from "./pages/template";
import store from "./store";
import { PouchDBProvider } from "./contexts/PouchDB";

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

export default function Hvsna({ config, db }: { config: AppConfig; db: any }) {
  const f7params = {
    store,
    routes: [
      {
        path: "/",
        component: TabsPage,
        tabs: [
          {
            path: "/",
            id: "today",
            component: ViewToday
          },
          {
            path: "/tab2/",
            id: "tab2",
            content: `
        <div class="block block-strong inset">
          <p>Tab 2 content</p>
        </div>
        `,
          },
          {
            path: "/settings/",
            id: "settings",
            component: Settings
          },
        ],
      },
      {
        path: "/template/",
        component: Template
      }
    ],
    name: "Hvsna",
  };

  return (
    <ClerkProvider publishableKey={config.clerkPublishableKey || ""}>
      <DroppableContext>
          <PouchDBProvider dbName="hvsna-notes">
              <App {...f7params}>
                <Views tabs>
                    <View id="today" main url="/" />
                    <View id="tab-2" tab />
                    <View id="settings" tab />
                </Views>
              </App>
          </PouchDBProvider>
      </DroppableContext>
    </ClerkProvider>
  );
}
