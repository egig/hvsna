import { useEffect, useState } from "react";
import { Page, Navbar } from "../../navigation";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { createNotificationsDriver } from "../../../infra";
import type { NotificationPermissionResult } from "../../../domain/notifications/INotificationsProvider";

const driver = createNotificationsDriver();

export default function NotificationSettings() {
  const { t } = useLanguageContext();
  const [permState, setPermState] =
    useState<NotificationPermissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    driver.checkPermissions().then(setPermState);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const result = await driver.requestPermissions();
      setPermState(result);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      await driver.scheduleTaskReminder({
        taskId: "notification-test",
        taskName: t("send_test_notification"),
        scheduledTime: Date.now() + 3000,
        reminderMinutes: 0,
        type: "due",
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const stateLabel = () => {
    if (!permState) return null;
    if (permState.state === "granted")
      return (
        <span className="text-green-600 font-medium">
          {t("notification_permission_granted")}
        </span>
      );
    if (permState.state === "denied")
      return (
        <span className="text-red-500 font-medium">
          {t("notification_permission_denied")}
        </span>
      );
    return (
      <span className="text-gray-500 font-medium">
        {t("notification_permission_prompt")}
      </span>
    );
  };

  return (
    <Page>
      <Navbar title={t("notifications")} showBackButton={true} />

      <div className="bg-white">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <span className="text-gray-900 font-semibold">
            {t("notification_settings_subtitle")}
          </span>
          {stateLabel()}
        </div>

        {permState && permState.canRequest && permState.state !== "granted" && (
          <div className="p-4 border-b border-gray-200">
            <button
              type="button"
              onClick={handleEnable}
              disabled={loading}
              className="text-sm w-full md:w-fit py-2.5 px-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("enable_notifications")}
            </button>
          </div>
        )}

        {permState?.state === "granted" && (
          <div className="p-4">
            <button
              type="button"
              onClick={handleTest}
              disabled={loading}
              className="text-sm w-full md:w-fit py-2.5 px-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testSent
                ? t("notification_test_sent")
                : t("send_test_notification")}
            </button>
          </div>
        )}
      </div>
    </Page>
  );
}
