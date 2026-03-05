import { type ReactNode } from "react";
import {
  LogIn,
  Trash,
  Cog,
  Info,
  RefreshCw,
  User,
  LogOut,
  Calendar,
} from "lucide-react";
import { Modal } from "../modules/navigation/modal";
import { useLanguageContext } from "../modules/i18n/LanguageContext";
import { SignedIn, SignedOut, useClerk } from "@clerk/clerk-react";
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Link, useLocation, useNavigate } from "react-router";

export interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  requiresAuth?: boolean;
  hideWhenSignedIn?: boolean;
}

interface SettingsModalProps {
  sections: SettingsSection[];
  onClose: () => void;
  isOpen: boolean;
  className?: string;
  children?: ReactNode;
}

export function SettingsModal({
  sections,
  onClose,
  isOpen,
  className = "",
  children,
}: SettingsModalProps) {
  const { t } = useLanguageContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currentSection = sections.find(
    (section) => section.path === location.pathname,
  );

  const handleSectionChange = (path: string) => {
    navigate(path, {
      state: {
        settingsBackgroundLocation: location.state?.settingsBackgroundLocation,
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      // title={t("settings")}
      className="max-w-5xl h-[60vh] max-h-[800px] overflow-hidden flex flex-col"
      noPadding
    >
      {/* Modal Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidenav */}
        <div className="w-56 bg-gray-50 border-r border-gray-200 flex-shrink-0">
          <nav className="p-3 space-y-1">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("settings")}
              </h2>
            </div>
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = section.path === location.pathname;

              return (
                <div key={section.id}>
                  {section.requiresAuth && (
                    <SignedIn>
                      <button
                        onClick={() => handleSectionChange(section.path)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isActive
                            ? "bg-primary-50 text-primary-600"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{section.title}</span>
                      </button>
                    </SignedIn>
                  )}
                  {section.hideWhenSignedIn && (
                    <SignedOut>
                      <button
                        onClick={() => handleSectionChange(section.path)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isActive
                            ? "bg-primary-50 text-primary-600"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{section.title}</span>
                      </button>
                    </SignedOut>
                  )}
                  {!section.requiresAuth && !section.hideWhenSignedIn && (
                    <button
                      onClick={() => handleSectionChange(section.path)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? "bg-primary-50 text-primary-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{section.title}</span>
                    </button>
                  )}
                </div>
              );
            })}

            {/* Sign Out Button */}
            <SignedIn>
              <div className="pt-4 mt-4 border-t border-gray-200">
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{t("sign_out")}</span>
                </button>
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
                          onClick={() => signOut()}
                          className="px-4 py-2 text-sm font-medium rounded-lg bg-danger-500 text-white hover:bg-danger-600 transition-colors"
                        >
                          {t("sign_out")}
                        </button>
                      </div>
                    </Dialog.Popup>
                  </Dialog.Viewport>
                </Dialog.Portal>
              </Dialog.Root>
            </SignedIn>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-auto">
            <div className="p-6">{children}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface SettingsLayoutProps {
  sections: SettingsSection[];
  className?: string;
  children?: ReactNode;
}

export const defaultSettingsSections: Omit<SettingsSection, "path">[] = [
  {
    id: "account",
    title: "Account",
    icon: User,
    requiresAuth: true,
  },
  {
    id: "general",
    title: "General",
    icon: Cog,
  },
  {
    id: "sync",
    title: "Sync",
    icon: RefreshCw,
    requiresAuth: true,
  },
  {
    id: "calendar",
    title: "Calendar",
    icon: Calendar,
  },
  {
    id: "reset",
    title: "Reset Device Data",
    icon: Trash,
  },
  {
    id: "about",
    title: "About",
    icon: Info,
  },
];
