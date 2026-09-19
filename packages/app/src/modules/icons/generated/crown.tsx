import type { SVGProps } from "react";
export function IconCrown({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}><path d="m12 6 4 6 5-4-2 10H5L3 8l5 4z" /></svg>;
}