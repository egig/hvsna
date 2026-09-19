import type { SVGProps } from "react";
export function IconLanguage({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}><path d="M9 6.371C9 10.789 6.761 13 4 13M4 6.371h7" /><path d="M5 9c0 2.144 2.252 3.908 6 4M12 20l4-9 4 9M19.1 18h-6.2M6.694 3l.793.582" /></svg>;
}