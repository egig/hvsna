import { createContext, useContext } from "react";
import { HvPanelLeft } from "@/modules/icons";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";

interface DesktopSidebarContextValue {
  /** True when the sidebar is fully hidden. */
  collapsed: boolean;
  /** Flip the sidebar between hidden and visible. */
  toggle: () => void;
}

const DesktopSidebarContext = createContext<DesktopSidebarContextValue | null>(
  null,
);

export const DesktopSidebarProvider = DesktopSidebarContext.Provider;

/** Null when rendered outside the desktop app shell (e.g. auth screens). */
export function useDesktopSidebar(): DesktopSidebarContextValue | null {
  return useContext(DesktopSidebarContext);
}

/**
 * Header affordance for reopening the sidebar once it is fully hidden. Renders
 * nothing when there is no sidebar context or the sidebar is already visible.
 */
export function SidebarToggleButton({ className = "" }: { className?: string }) {
  const ctx = useDesktopSidebar();
  const { t } = useLanguageContext();

  if (!ctx || !ctx.collapsed) return null;

  return (
    <button
      onClick={ctx.toggle}
      className={`p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors ${className}`}
      aria-label={t("expand_sidebar")}
      title={t("expand_sidebar")}
    >
      <HvPanelLeft className="size-5" />
    </button>
  );
}
