import { useScreenSize } from "./modules/components/screen-size-wrapper";
import { RoutesDesktop } from "./screens/desktop/routes-desktop";
import { RoutesMobile } from "./screens/mobile/routes";

export const ResponsiveRoutes = () => {
  const { isDesktop } = useScreenSize();
  console.log("debug", isDesktop);
  if (isDesktop) return <RoutesDesktop />;
  return <RoutesMobile />;
};
