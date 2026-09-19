import type { SVGProps } from "react";
export function IconSunset2({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}><path d="M3 13h1M20 13h1M5.6 6.6l.7.7M18.4 6.6l-.7.7M8 13a4 4 0 1 1 8 0M3 17h18M7 20h5M16 20h1M12 5V4" /></svg>;
}