import { Content, Drawer } from "vaul";
import { type ReactNode } from "react";
import { useScreenSize } from "../../ui/screen-size-wrapper";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  const { isDesktop } = useScreenSize();

  // Desktop Modal - centered modal with backdrop
  if (isDesktop) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Modal Body */}
          <div className="p-2">{children}</div>
        </div>
      </div>
    );
  }

  // Mobile Modal - slide-up drawer (existing implementation)
  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open: boolean) => !open && onClose()}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-white z-[1000] rounded-t-[10px] fixed bottom-0 left-0 right-0 outline-none">
          <Drawer.Handle />
          <div className="hidden h-0">
            <Drawer.Title>{title}</Drawer.Title>
            <Drawer.Description />
            <Drawer.Close />
          </div>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
