import type { SVGProps } from "react";
export function IconArrowLeft({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}><path d="M5 12h14M5 12l6 6M5 12l6-6" /></svg>;
}