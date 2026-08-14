import type { SVGProps } from "react";
export function IconArrowUp({ size, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" {...props}><path d="M12 5v14M18 11l-6-6M6 11l6-6" /></svg>;
}