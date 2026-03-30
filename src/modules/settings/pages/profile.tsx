import { useUser } from "@clerk/react";
import { Page } from "../../navigation";
import { Navbar } from "../../navigation";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { User, Mail } from "lucide-react";

export default function Profile() {
  const { t } = useLanguageContext();
  const { user } = useUser();

  return (
    <Page>
      <Navbar title={t("account")} showBackButton={true} />
      <div className="w-full max-w-md mx-auto p-4 space-y-4">
        {/* User Info Card */}
        {user && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {user.fullName || t("user")}
                </h2>
                <p className="text-sm text-gray-500">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {user.primaryEmailAddress?.emailAddress}
                </span>
              </div>
              {user.username && (
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    @{user.username}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <a
                className="text-[var(--hvsna-primary-color)] hover:underline cursor-pointer"
                href={`${import.meta.env.VITE_CLERK_ACCOUNT_PORTAL}/user`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("manage_account")}
              </a>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
