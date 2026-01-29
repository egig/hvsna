import { Outlet } from "react-router";
import { TabBar } from "../navigation/components/TabBar";

export default function Layout() {
    return (
        <div className="max-w-[520px] m-auto">
            <Outlet />
            <TabBar />
        </div>
    );
}