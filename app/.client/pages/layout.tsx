import { Outlet } from "react-router";

export default function Layout() {
    return (
        <div className="max-w-[520px] m-auto">
            <Outlet />
            {/* <BottomNav /> */}
        </div>
    );
}