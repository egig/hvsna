import type { SVGProps } from "react";
export function IconCircleCheck({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" {...props}><path d="M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0" /><path d="m9 12 2 2 4-4" /></svg>;
}