import { Outlet } from "react-router";
import BottomNav from "../components/bottom-nav";
import { useSession } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import sync from "~/lib/sync";
import { createClient } from "@supabase/supabase-js";
import { useDatabase } from "~/lib/database";

export default function Layout() {
    return (
        <div className="max-w-[520px] m-auto">
            <Outlet />
            {/* <BottomNav /> */}
        </div>
    );
}