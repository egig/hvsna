import { useCallback, useMemo, useState } from "react";
import { Outlet } from "react-router";
import { Allotment } from "allotment";
import { DesktopSidebar } from "@/screens/desktop/desktop-sidebar";
import { DesktopSidebarProvider } from "@/screens/desktop/sidebar-context";

import "allotment/dist/style.css";

const SIDEBAR_COLLAPSED_KEY = "desktop-sidebar-collapsed";
const EXPANDED_WIDTH = 192;

export default function Layout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true",
  );

  const setCollapsedPersisted = useCallback((value: boolean) => {
    setCollapsed((prev) => {
      if (prev !== value)
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
      return value;
    });
  }, []);

  const toggleSidebar = useCallback(
    () => setCollapsedPersisted(!collapsed),
    [collapsed, setCollapsedPersisted],
  );

  const sidebarContext = useMemo(
    () => ({ collapsed, toggle: toggleSidebar }),
    [collapsed, toggleSidebar],
  );

  return (
    <DesktopSidebarProvider value={sidebarContext}>
      <Allotment
        className="h-full"
        proportionalLayout={false}
        // Sidebar fully hides when collapsed rather than shrinking to a rail.
        onVisibleChange={(index, visible) => {
          if (index === 0) setCollapsedPersisted(!visible);
        }}
      >
        <Allotment.Pane
          preferredSize={EXPANDED_WIDTH}
          minSize={160}
          maxSize={400}
          visible={!collapsed}
          snap
        >
          <DesktopSidebar
            collapsed={false}
            onToggleCollapse={toggleSidebar}
          />
        </Allotment.Pane>

        <Allotment.Pane minSize={400}>
          {/* Bounded flex column — each screen owns its own scroll (PageDesktop's
              inner pane, or Allotment on the upcoming screen). */}
          <div className="flex flex-col h-full relative overflow-hidden">
            <Outlet />
          </div>
        </Allotment.Pane>
      </Allotment>
    </DesktopSidebarProvider>
  );
}
