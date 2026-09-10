import {
  createContext,
  useContext,
  type ComponentType,
  type FC,
  type ReactNode,
} from "react";
import { useScreenSize } from "@/modules/components/screen-size-wrapper";
import { ModalProvider, type ModalProps } from "@/modules/navigation";
import { Modal as DesktopModal } from "./desktop/modal";
import { Modal as MobileModal } from "./mobile/modal";
import { RoutesDesktop } from "./desktop/routes-desktop";
import { RoutesMobile } from "./mobile/routes";

interface Platform {
  isDesktop: boolean;
  Routes: FC;
  Modal: ComponentType<ModalProps>;
}

const desktop: Platform = {
  isDesktop: true,
  Routes: RoutesDesktop,
  Modal: DesktopModal,
};
const mobile: Platform = {
  isDesktop: false,
  Routes: RoutesMobile,
  Modal: MobileModal,
};

const PlatformContext = createContext<Platform | null>(null);

/**
 * The single desktop/mobile decision in the app. Everything platform-specific
 * hangs off this one `isDesktop` read — the route tree (`usePlatform().Routes`,
 * rendered by `ResponsiveRoutes`) and the `Modal` component (fed to
 * `ModalProvider` here so cross-cutting `modules/` components can `useModal()`).
 * Seeded high in `app.tsx` so providers above the router (e.g. `LocationProvider`,
 * which renders `LocationPickerModal`) are still inside `ModalProvider`.
 */
export function PlatformProvider({ children }: { children: ReactNode }) {
  const { isDesktop } = useScreenSize();
  const platform = isDesktop ? desktop : mobile;
  return (
    <PlatformContext.Provider value={platform}>
      <ModalProvider component={platform.Modal}>{children}</ModalProvider>
    </PlatformContext.Provider>
  );
}

export function usePlatform(): Platform {
  const platform = useContext(PlatformContext);
  if (!platform) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return platform;
}
