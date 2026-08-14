import type { SVGProps } from "react";
export function IconEye({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" {...props}><path d="M10 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0" /><path d="M21 12q-3.6 6-9 6t-9-6q3.6-6 9-6t9 6" /></svg>;
}