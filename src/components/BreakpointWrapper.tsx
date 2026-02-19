import React, { useEffect } from "react";
import { XIcon, SmartphoneIcon } from "lucide-react";
import { useSystemStore } from "../stores/systemStore";

interface BreakpointWrapperProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const BreakpointWrapper: React.FC<BreakpointWrapperProps> = ({
  children,
  onClose,
  className = "",
}) => {
  const { isBreakpointWrapperVisible, setBreakpointWrapperVisible } =
    useSystemStore();
  const [shouldShow, setShouldShow] = React.useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setShouldShow(width >= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleClose = () => {
    setBreakpointWrapperVisible(false);
    onClose?.();
  };

  if (!shouldShow || !isBreakpointWrapperVisible) {
    return <>{children}</>;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`}
    >
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <SmartphoneIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Mobile Only</h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-600 mb-3">
            This app is optimized for mobile devices. Desktop and tablet support
            is coming soon!
          </p>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              For the best experience, use your mobile device or resize your
              browser to mobile width.
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Continue on Desktop
        </button>
      </div>
    </div>
  );
};
