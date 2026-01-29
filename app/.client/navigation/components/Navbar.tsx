import { useAppNavigation } from '../hooks/useAppNavigation';
import { useLocation } from 'react-router';

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
  customBackAction?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

const ROOT_PATHS = ['/home', '/explore', '/examples', '/templates', '/'];
const FORM_PATHS = ['/form-example'];

export function Navbar({ 
  title, 
  showBackButton: propShowBackButton,
  customBackAction,
  rightAction,
  className = ""
}: NavbarProps) {
  const { goBack } = useAppNavigation();
  const location = useLocation();

  // Auto-determine if back button should be shown
  const shouldShowBackButton = propShowBackButton ?? (
    !ROOT_PATHS.includes(location.pathname) && !FORM_PATHS.includes(location.pathname)
  );

  const handleBack = () => {
    if (customBackAction) {
      customBackAction();
    } else {
      goBack();
    }
  };

  return (
    <header className={`flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 safe-top ${className}`}>
      {/* Left: Back Button */}
      <div className="w-16 flex justify-start">
        {shouldShowBackButton && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg transition-opacity no-select active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <svg
              className="w-6 h-6 text-gray-900 dark:text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Center: Title */}
      <div className="flex-1 text-center">
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Right: Action */}
      <div className="w-16 flex justify-end">
        {rightAction}
      </div>
    </header>
  );
}
