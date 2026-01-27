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
import DataManagement from "./pages/data-management";
import store from "./store";
import { PouchDBProvider } from "./contexts/PouchDB";
import Notes from "./pages/notes";
import Tasks from "./pages/tasks";
import Trackers from "./pages/trackers";
import EvaluationList from "./pages/evaluation-list";
import Journal from "./pages/journal";
import Overview from "./pages/overview";
import Categories from "./pages/categories";

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
  const f7params = {
    store,
    colors: {
      primary: "#5A4A7A"
    },
    routes: [
      {
        path: "/",
        component: TabsPage,
        tabs: [
          {
            path: "/",
            id: "today",
            component: Overview
          },
          {
            path: "/notes/",
            id: "notes",
            component: Notes
          },
          {
            path: "/tasks/",
            id: "tasks",
            component: Tasks
          },
          {
            path: "/settings/",
            id: "settings",
            component: Settings
          },
        ],
      },
      {
        path: "/evaluations",
        component: EvaluationList
      },
      {
        path: "/journal",
        component: Journal
      },
      {
        path: "/overview",
        component: Overview
      },
      {
        path: "/categories",
        component: Categories
      },
      {
        path: "/trackers/",
        component: Trackers
      },
      {
        path: "/template/",
        component: Template
      },
      {
        path: "/data-management/",
        component: DataManagement
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
                    <View id="notes" tab />
                    <View id="tasks" tab />
                    <View id="settings" tab />
                </Views>
              </App>
          </PouchDBProvider>
      </DroppableContext>
    </ClerkProvider>
  );
}
