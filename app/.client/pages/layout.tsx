import { Outlet } from "react-router";
import BottomNav from "../components/bottom-nav";
import { useSession } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import sync from "~/lib/sync";
import { createClient } from "@supabase/supabase-js";
import { useDatabase } from "~/lib/database";

export default function Layout() {
    const {session}= useSession();
    const {db} = useDatabase();
    const [syncInitialized, setSyncInitialized] = useState(false);
    
    const sClient = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,{
        accessToken: () => session?.getToken() ?? Promise.resolve(null)
      });

    useEffect(() => {
      const initializeSync = async () => {
        if (!!db && session?.user?.id && !syncInitialized) {
          try {
            await sync(sClient, db?.notes, session?.user?.id);
            setSyncInitialized(true);
          } catch (error) {
          }
        }
      };
      
      initializeSync();
    }, [db, session?.user?.id, syncInitialized, sClient]);

    return <div className="max-w-[520px] m-auto">
    <Outlet />
    <BottomNav />
    </div>
}