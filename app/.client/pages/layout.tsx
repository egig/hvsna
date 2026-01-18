import { Outlet } from "react-router";
import BottomNav from "../components/bottom-nav";

export default function Layout() {
    return <div className="max-w-[520px] m-auto">
    <Outlet />
    <BottomNav />
    </div>
}