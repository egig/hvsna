import type { SVGProps } from "react";
export function IconRotateClockwise({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" {...props}><path d="M4.05 11a8 8 0 1 1 .5 4m-.5 5v-5h5" /></svg>;
}