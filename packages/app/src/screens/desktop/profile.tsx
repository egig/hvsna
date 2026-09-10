import { useAuth } from "@/modules/auth/use-auth";
import { SettingsHeader } from "./settings-header";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";
import { HvUser, HvMail } from "@/modules/icons";

export default function Profile() {
  const { t } = useLanguageContext();
  const { user } = useAuth();

  return (
    <>
      <SettingsHeader title={t("account")} />
      {user && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <HvUser className="w-8 h-8 text-gray-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email?.split("@")[0] || t("user")}
              </h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <HvMail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <HvUser className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                User ID: {user.userId}
              </span>
            </div>
            {user.createdAt && (
              <div className="flex items-center space-x-3">
                <HvUser className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Member since: {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
