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
import { SignedIn, SignedOut, SignOutButton } from "@clerk/clerk-react";
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
      title={t("settings")}
      className="max-w-6xl h-[80vh] max-h-[800px] overflow-hidden flex flex-col"
      noPadding
    >
      {/* Modal Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidenav */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0">
          <nav className="p-3 space-y-1">
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
                            ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">
                          {section.title}
                        </span>
                      </button>
                    </SignedIn>
                  )}
                  {section.hideWhenSignedIn && (
                    <SignedOut>
                      <button
                        onClick={() => handleSectionChange(section.path)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">
                          {section.title}
                        </span>
                      </button>
                    </SignedOut>
                  )}
                  {!section.requiresAuth && !section.hideWhenSignedIn && (
                    <button
                      onClick={() => handleSectionChange(section.path)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm">
                        {section.title}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}

            {/* Sign Out Button */}
            <SignedIn>
              <div className="pt-4 mt-4 border-t border-gray-200">
                <SignOutButton>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{t("sign_out")}</span>
                  </button>
                </SignOutButton>
              </div>
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

export function SettingsLayout({
  sections,
  className = "",
  children,
}: SettingsLayoutProps) {
  const { t } = useLanguageContext();
  const location = useLocation();

  const currentSection = sections.find(
    (section) => section.path === location.pathname,
  );

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Sidenav */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("settings")}
          </h2>
        </div>

        <nav className="p-2 space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = section.path === location.pathname;

            return (
              <div key={section.id}>
                {section.requiresAuth && (
                  <SignedIn>
                    <Link
                      to={section.path}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors block ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.title}</span>
                    </Link>
                  </SignedIn>
                )}
                {section.hideWhenSignedIn && (
                  <SignedOut>
                    <Link
                      to={section.path}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors block ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.title}</span>
                    </Link>
                  </SignedOut>
                )}
                {!section.requiresAuth && !section.hideWhenSignedIn && (
                  <Link
                    to={section.path}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors block ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.title}</span>
                  </Link>
                )}
              </div>
            );
          })}

          {/* Sign Out Button */}
          <SignedIn>
            <SignOutButton>
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{t("sign_out")}</span>
              </button>
            </SignOutButton>
          </SignedIn>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentSection && (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center space-x-3">
                <currentSection.icon className="w-6 h-6 text-gray-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  {currentSection.title}
                </h1>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-gray-50">
              <div className="p-6">{children}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
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
