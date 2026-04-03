import { Content, Drawer } from "vaul";
import { Dialog } from "@base-ui/react/dialog";
import { type ReactNode } from "react";
import { useScreenSize } from "../components/screen-size-wrapper";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  noPadding?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  className = "",
  noPadding = false,
}: ModalProps) {
  const { isDesktop } = useScreenSize();

  // Desktop Modal - centered modal with backdrop using Base UI Dialog
  if (isDesktop) {
    return (
      <Dialog.Root
        open={isOpen}
        onOpenChange={(open: boolean) => !open && onClose()}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Viewport>
            <Dialog.Popup
              className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-xl w-full mx-4 outline-none ${className || "max-w-lg max-h-[90vh] overflow-auto"}`}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                  <Dialog.Close
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
                  </Dialog.Close>
                </div>
              )}

              {/* Modal Body */}
              {noPadding ? children : <div className="p-2">{children}</div>}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
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
