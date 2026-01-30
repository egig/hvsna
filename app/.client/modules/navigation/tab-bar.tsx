import { useLocation } from "react-router";
import { Button } from "./button";
import { Check, CheckSquare, Home, Settings } from "lucide-react";

const tabs = [
  { path: "/", label: "Home", icon: <Home /> },
  { path: "/tasks", label: "Tasks", icon: <CheckSquare /> },
  { path: "/settings", label: "Settings", icon: <Settings /> },
];

export function TabBar() {
  const location = useLocation();

  const getIsActive = (tabPath: string) => {
    const isRootTab = tabPath === "/";
    const isCurrentTab = location.pathname === tabPath;
    const isChildTab = location.pathname.startsWith(`${tabPath}/`);
    return isRootTab ? isCurrentTab : isChildTab || isCurrentTab;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 no-select">
      <div
        className="flex justify-around items-center h-16"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = getIsActive(tab.path);
          return (
            <Button
              to={tab.path}
              navType="tab"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-2xl mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
