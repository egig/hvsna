import { Outlet } from 'react-router';

export function StandaloneLayout() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50 dark:bg-black">
      {/* Main Content Area - Full screen without tab bar */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
