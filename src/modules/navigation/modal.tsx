import { Content, Drawer } from "vaul";
import { type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open: boolean) => !open && onClose()}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-white z-[1000] rounded-t-[10px] fixed bottom-0 left-0 right-0 outline-none">
          <Drawer.Handle />
          <div className="display-none h-0">
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
