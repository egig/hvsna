import { useState, useRef, useCallback } from "react";
import { Outlet } from "react-router";
import { Allotment, type AllotmentHandle } from "allotment";
import { DesktopSidebar } from "@/screens/desktop/desktop-sidebar";

import "allotment/dist/style.css";

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const allotmentRef = useRef<AllotmentHandle>(null);

  const handleToggleSidebar = useCallback(() => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    const newSize = newCollapsed ? 56 : 192;
    allotmentRef.current?.resize([newSize, window.innerWidth - newSize]);
  }, [sidebarCollapsed]);

  const handleSidebarChange = useCallback((sizes: number[]) => {
    setSidebarCollapsed(sizes[0] < 120);
  }, []);

  // Desktop Layout with side navigation
  return (
    <Allotment
      ref={allotmentRef}
      className="h-screen"
      proportionalLayout={false}
      defaultSizes={[192, window.innerWidth]}
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
