import { NavLink } from 'react-router';
import { Calendar, Info } from 'lucide-react';

export default function BottomNav() {
  const menuItems = [
    { id: 'calendar', label: 'Today', icon: Calendar, to: "/" },
    { id: 'settings', label: 'About', icon: Info, to: "/about" }
  ];

  return (
      <nav className="h-[65px] bg-white border-t border-gray-200 shadow-lg fixed bottom-0 left-0 right-0">
        <div className="max-w-md mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            {menuItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <NavLink
                    to={item.to}
                  key={item.id}
                  className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
  );
}