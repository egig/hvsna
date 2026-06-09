import { Drawer } from "vaul";
import { type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  noPadding?: boolean;
  "data-testid"?: string;
  dismissable?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  "data-testid": testId,
  dismissable = true,
}: ModalProps) {
  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open: boolean) => !open && onClose()}
      dismissible={!!dismissable}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed z-[1000] inset-0 bg-black/40" />
        <Drawer.Content
          className="bg-white z-[1000] rounded-t-[10px] fixed bottom-0 left-0 right-0 outline-none"
          data-testid={testId}
        >
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
