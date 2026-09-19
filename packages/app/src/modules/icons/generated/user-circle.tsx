import type { SVGProps } from "react";
export function IconUserCircle({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}><path d="M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0" /><path d="M9 10a3 3 0 1 0 6 0 3 3 0 1 0-6 0M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855" /></svg>;
}