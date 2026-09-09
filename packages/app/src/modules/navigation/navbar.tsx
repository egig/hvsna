import { useScreenSize } from "@/modules/components/screen-size-wrapper";
import { NavbarMobile, LargeNavbarMobile } from "./navbar-mobile";
import { NavbarDesktop, LargeNavbarDesktop } from "./navbar-desktop";
import type { NavbarProps } from "./navbar-props";

export type { NavbarProps };

export function Navbar(props: NavbarProps) {
  const { isDesktop } = useScreenSize();
  return isDesktop ? <NavbarDesktop {...props} /> : <NavbarMobile {...props} />;
}

export function LargeNavbar(props: NavbarProps) {
  const { isDesktop } = useScreenSize();
  return isDesktop ? (
    <LargeNavbarDesktop {...props} />
  ) : (
    <LargeNavbarMobile {...props} />
  );
}
