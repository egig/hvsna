import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  const navigate = useNavigate();

  // Handle browser back button to close modal
  useEffect(() => {
    const handlePopState = () => {
      onClose();
    };

    if (isOpen) {
      window.addEventListener('popstate', handlePopState);
      // Add a history entry so back button works
      window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = () => {
    onClose();
    navigate(-1);
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              mass: 0.8
            }}
            className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[80vh] overflow-hidden"
            onClick={handleContentClick}
            style={{
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Handle Bar */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            
            {/* Header */}
            {title && (
              <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto scroll-area">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
