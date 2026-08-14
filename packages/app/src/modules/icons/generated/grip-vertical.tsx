import type { SVGProps } from "react";
export function IconGripVertical({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" {...props}><path d="M8 5a1 1 0 1 0 2 0 1 1 0 1 0-2 0M8 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0M8 19a1 1 0 1 0 2 0 1 1 0 1 0-2 0M14 5a1 1 0 1 0 2 0 1 1 0 1 0-2 0M14 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0M14 19a1 1 0 1 0 2 0 1 1 0 1 0-2 0" /></svg>;
}