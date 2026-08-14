import type { SVGProps } from "react";
export function IconDatabase({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" {...props}><path d="M4 6a8 3 0 1 0 16 0A8 3 0 1 0 4 6" /><path d="M4 6v6a8 3 0 0 0 16 0V6" /><path d="M4 12v6a8 3 0 0 0 16 0v-6" /></svg>;
}