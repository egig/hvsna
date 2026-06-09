import { Popover, PopoverDisclosure, usePopoverStore } from "@ariakit/react";
import { Drawer } from "vaul";
import { type ReactElement, type ReactNode } from "react";
import { useScreenSize } from "../components/screen-size-wrapper";

interface ContextMenuProps {
  trigger: ReactElement;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  dismissable?: boolean;
  "data-testid"?: string;
}

export function ContextMenu({
  trigger,
  children,
  open,
  onOpenChange,
  title,
  dismissable = true,
  "data-testid": testId,
}: ContextMenuProps) {
  const { isDesktop } = useScreenSize();
  const popover = usePopoverStore({
    open,
    setOpen: onOpenChange,
    placement: "bottom-start",
  });

  // Desktop - anchored dropdown using Ariakit Popover
  if (isDesktop) {
    return (
      <>
        <PopoverDisclosure render={trigger} store={popover} />
        <Popover
          portal
          store={popover}
          gutter={8}
          hideOnInteractOutside={dismissable}
          className="z-[10001] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-auto"
          data-testid={testId}
        >
          {children}
        </Popover>
      </>
    );
  }

  // Mobile - slide-up drawer using vaul
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible={!!dismissable}
    >
      <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed z-[1000] inset-0 bg-black/40" />
        <Drawer.Content
          className="bg-white dark:bg-gray-800 z-[1000] rounded-t-[10px] fixed bottom-0 left-0 right-0 outline-none"
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
