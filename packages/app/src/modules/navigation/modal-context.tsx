import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  noPadding?: boolean;
  "data-testid"?: string;
  dismissable?: boolean;
}

/**
 * The platform-specific `Modal` component (desktop centered dialog vs. mobile
 * bottom drawer). Seeded once per route tree by `RoutesDesktop` / `RoutesMobile`
 * so cross-cutting `modules/` components can render a modal without a runtime
 * `isDesktop` branch and without importing from `screens/`.
 */
const ModalContext = createContext<ComponentType<ModalProps> | null>(null);

export function ModalProvider({
  component,
  children,
}: {
  component: ComponentType<ModalProps>;
  children: ReactNode;
}) {
  return (
    <ModalContext.Provider value={component}>{children}</ModalContext.Provider>
  );
}

export function useModal(): ComponentType<ModalProps> {
  const Modal = useContext(ModalContext);
  if (!Modal) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return Modal;
}
