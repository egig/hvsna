import type { ReactNode } from "react";
import { HvAlertCircle, HvInfo } from "@/modules/icons";

interface AnnouncementBarProps {
  message: ReactNode;
  action?: ReactNode;
  tone?: "info" | "warning";
}

const toneStyles = {
  info: {
    wrapper: "bg-blue-50 border-blue-200 text-blue-800",
    icon: "text-blue-600",
  },
  warning: {
    wrapper: "bg-amber-50 border-amber-200 text-amber-800",
    icon: "text-amber-600",
  },
} as const;

/**
 * A slim, dismiss-free strip meant to sit above routed content in normal
 * document flow (never fixed/absolute) so it pushes the app down instead of
 * covering it — see app.tsx, where the surrounding layout is sized to
 * shrink around it rather than assume a fixed viewport height.
 */
export function AnnouncementBar({
  message,
  action,
  tone = "warning",
}: AnnouncementBarProps) {
  const styles = toneStyles[tone];
  const Icon = tone === "warning" ? HvAlertCircle : HvInfo;

  return (
    <div
      className={`flex-shrink-0 border-b px-4 py-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm ${styles.wrapper}`}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${styles.icon}`} />
      <span>{message}</span>
      {action}
    </div>
  );
}
