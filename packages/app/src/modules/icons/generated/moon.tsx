import type { SVGProps } from "react";
export function IconMoon({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" {...props}><path d="M12 3h.393a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.992z" /></svg>;
}