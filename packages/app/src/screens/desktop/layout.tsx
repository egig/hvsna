import { useState, useRef, useCallback } from "react";
import { Outlet } from "react-router";
import { Allotment, type AllotmentHandle } from "allotment";
import { DesktopSidebar } from "@/screens/desktop/desktop-sidebar";

import "allotment/dist/style.css";

const SIDEBAR_COLLAPSED_KEY = "desktop-sidebar-collapsed";

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true",
  );
  const allotmentRef = useRef<AllotmentHandle>(null);

  const persistSidebarCollapsed = (collapsed: boolean) => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  };

  const handleToggleSidebar = useCallback(() => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    persistSidebarCollapsed(newCollapsed);
    const newSize = newCollapsed ? 56 : 192;
    allotmentRef.current?.resize([newSize, window.innerWidth - newSize]);
  }, [sidebarCollapsed]);

  const handleSidebarChange = useCallback((sizes: number[]) => {
    const collapsed = sizes[0] < 120;
    setSidebarCollapsed(collapsed);
    persistSidebarCollapsed(collapsed);
  }, []);

  // Desktop Layout with side navigation
  return (
    <Allotment
      ref={allotmentRef}
      className="h-full"
      proportionalLayout={false}
      defaultSizes={[sidebarCollapsed ? 56 : 192, window.innerWidth]}
      onChange={handleSidebarChange}
    >
      {/* Sidebar pane */}
      <Allotment.Pane preferredSize={192} minSize={56} maxSize={400} snap>
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </Allotment.Pane>

      {/* Main content pane */}
      <Allotment.Pane minSize={400}>
        <div className="flex flex-col h-full relative">
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </div>
      </Allotment.Pane>
    </Allotment>
  );
}
