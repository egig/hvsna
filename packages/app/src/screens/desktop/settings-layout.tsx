import { useState, type ReactNode } from "react";
import {
  HvBell,
  HvLogIn,
  HvTrash,
  HvSettings,
  HvInfo,
  HvRefreshCw,
  HvUser,
  HvLogOut,
  HvCalendar,
  HvCreditCard,
} from "@/modules/icons";
import { Dialog } from "@base-ui/react/dialog";
import { useLocation, useNavigate } from "react-router";
import { Modal } from "./modal";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";
import { useAuth } from "@/modules/auth/use-auth";

export interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  requiresAuth?: boolean;
  hideWhenSignedIn?: boolean;
}

export const defaultSettingsSections: SettingsSection[] = [
  {
    id: "signin",
    title: "Sign In",
    icon: HvLogIn,
    hideWhenSignedIn: true,
    path: "/signin",
  },
  {
    id: "account",
    title: "Account",
    icon: HvUser,
    requiresAuth: true,
    path: "/profile",
  },
  {
    id: "general",
    title: "General",
    icon: HvSettings,
    path: "/settings/general",
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: HvBell,
    path: "/settings/notifications",
  },
  { id: "sync", title: "Sync", icon: HvRefreshCw, path: "/sync" },
  {
    id: "subscription",
    title: "Subscription",
    icon: HvCreditCard,
    requiresAuth: true,
    path: "/settings/subscription",
  },
  {
    id: "hijri_date",
    title: "Hijri Date",
    icon: HvCalendar,
    path: "/settings/hijri-date",
  },
  { id: "reset", title: "Reset Data", icon: HvTrash, path: "/wipe-local" },
  { id: "about", title: "About", icon: HvInfo, path: "/about" },
];

interface SettingsModalProps {
  sections: SettingsSection[];
  onClose: () => void;
  isOpen: boolean;
  children?: ReactNode;
}

export function SettingsModal({
  sections,
  onClose,
  isOpen,
  children,
}: SettingsModalProps) {
  const { t } = useLanguageContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const goToSection = (path: string) => {
    navigate(path, {
      state: {
        settingsBackgroundLocation: location.state?.settingsBackgroundLocation,
      },
    });
  };

  const visibleSections = sections.filter((section) => {
    if (section.requiresAuth) return isAuthenticated;
    if (section.hideWhenSignedIn) return !isAuthenticated;
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl h-[80vh] max-h-[800px] overflow-hidden flex flex-col"
      noPadding
    >
      <div className="flex flex-1 overflow-hidden">
        {/* Section nav */}
        <nav className="w-48 flex-shrink-0 bg-gray-50 border-r border-gray-200 p-3 space-y-1 overflow-y-auto">
          <h2 className="px-3 py-2 mb-1 text-lg font-semibold text-gray-900">
            {t("settings")}
          </h2>

          {visibleSections.map((section) => {
            const Icon = section.icon;
            const isActive = section.path === location.pathname;
            return (
              <button
                key={section.id}
                onClick={() => goToSection(section.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{section.title}</span>
              </button>
            );
          })}

          {isAuthenticated && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={() => setConfirmOpen(true)}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-danger-600 hover:bg-danger-50 transition-colors"
              >
                <HvLogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{t("sign_out")}</span>
              </button>
            </div>
          )}
        </nav>

        {/* Section content */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="p-6">{children}</div>
        </div>
      </div>

      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <Dialog.Popup className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 outline-none">
              <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {t("sign_out")}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t("sign_out_confirm")}
              </Dialog.Description>
              <div className="flex gap-3 justify-end">
                <Dialog.Close className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  {t("cancel")}
                </Dialog.Close>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-danger-500 text-white hover:bg-danger-600 transition-colors"
                >
                  {t("sign_out")}
                </button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </Modal>
  );
}
