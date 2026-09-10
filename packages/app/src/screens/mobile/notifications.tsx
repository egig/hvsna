import { useEffect, useState } from "react";
import { PageMobile as Page } from "./page";
import { NavbarMobile as Navbar } from "./navbar-mobile";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";
import { createNotificationsDriver } from "@/infra";
import { useSettings } from "@/modules/settings/context";
import { ListInputSelect } from "@/modules/components/list-input-select";
import type { NotificationPermissionResult } from "@/domain/notifications/INotificationsProvider";

const driver = createNotificationsDriver();

const REMINDER_OPTIONS = [5, 10, 15, 30, 60];

export default function NotificationSettings() {
  const { t } = useLanguageContext();
  const { settings, updateSettings } = useSettings();
  const [permState, setPermState] =
    useState<NotificationPermissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    driver.checkPermissions().then(setPermState);
  }, []);

  const handleToggleNotifications = async () => {
    const newValue = !settings.notifications;

    if (newValue) {
      // Turning on - request permissions
      setLoading(true);
      try {
        const result = await driver.requestPermissions();
        setPermState(result);
        await updateSettings({ notifications: result.state === "granted" });
      } finally {
        setLoading(false);
      }
    } else {
      // Turning off
      await updateSettings({ notifications: false });
    }
  };

  const handleReminderMinutesChange = async (value: string) => {
    const minutes = parseInt(value, 10);
    await updateSettings({ reminderMinutesBefore: minutes });
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

  const notificationsEnabled = settings.notifications ?? false;
  const permissionDenied = permState?.state === "denied";
  const canShowTest = notificationsEnabled && permState?.state === "granted";

  return (
    <Page>
      <Navbar title={t("notifications")} showBackButton={true} />

      <div className="bg-white">
        {/* Enable Notifications Toggle */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">
              {t("enable_notifications_toggle")}
            </span>
            <button
              type="button"
              onClick={handleToggleNotifications}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationsEnabled ? "bg-primary-600" : "bg-gray-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-pressed={notificationsEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Permission denied help text */}
          {notificationsEnabled && permissionDenied && (
            <p className="mt-2 text-sm text-amber-600">
              {t("notification_permission_denied_help")}
            </p>
          )}
        </div>

        {/* Reminder Minutes Select */}
        {notificationsEnabled && (
          <ListInputSelect
            label={t("reminder_minutes_before")}
            value={(settings.reminderMinutesBefore ?? 15).toString()}
            onValueChange={handleReminderMinutesChange}
            disabled={loading}
            options={REMINDER_OPTIONS.map((minutes) => ({
              value: minutes.toString(),
              label: t(`_${minutes}_minutes` as any),
            }))}
          />
        )}

        {/* Test Button */}
        {canShowTest && (
          <div className="p-4">
            <button
              type="button"
              onClick={handleTest}
              disabled={loading}
              className="text-sm w-full md:w-fit py-2.5 px-4 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
