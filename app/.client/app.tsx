import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppRoutes } from "~/.client/app-routes";
import DroppableContext from "~/.client/components/droppable-context";
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
import Targets from "./pages/targets";
import Journal from "./pages/journal";
import Overview from "./pages/overview";
import Categories from "./pages/categories";
import { NavigationProvider } from "./navigation/contexts/NavigationContext";
import { AnimatePresence } from "framer-motion";

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
              <AnimatePresence mode="wait">
              <AppRoutes />
              </AnimatePresence>
            </NavigationProvider>
            </BrowserRouter>
          </PouchDBProvider>
      </DroppableContext>
    </ClerkProvider>
  );
}
