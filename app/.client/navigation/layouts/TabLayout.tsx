import { Outlet } from "react-router";
import { TabBar } from "../components/TabBar";

export function TabLayout() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50 dark:bg-black">
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden pb-16">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
