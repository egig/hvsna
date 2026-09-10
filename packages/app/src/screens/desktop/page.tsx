import type { ReactNode } from "react";
import { PageTransition } from "@/modules/navigation";

/**
 * Shared inset width for desktop screens — the navbar row and the page body
 * both align to this so list content isn't stretched edge-to-edge. Pass
 * `fluid` on a screen (e.g. calendar / week views) to opt back into full width.
 */
export const DESKTOP_INSET = "mx-auto w-full max-w-2xl";

type PageDesktopProps = {
  children: ReactNode;
  navbar?: ReactNode;
  /** Opt out of the centered inset container and use the full width. */
  fluid?: boolean;
};

export function PageDesktop({ children, navbar, fluid = false }: PageDesktopProps) {
  return (
    <PageTransition>
      <div className="flex flex-col h-full">
        {navbar && <div className="flex-shrink-0">{navbar}</div>}
        <div className="flex-1 overflow-y-auto relative">
          <div className={fluid ? undefined : DESKTOP_INSET}>{children}</div>
        </div>
      </div>
    </PageTransition>
  );
}
