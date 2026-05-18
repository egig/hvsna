import { HvRefreshCw } from "@/modules/icons";
import { Page } from "../navigation";
import packageInfo from "../../../package.json";
import { LargeNavbar } from "../navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import { usePlatform } from "../platform";
import { usePWARefresh } from "@/platforms/web/usePWARefresh";
import { useEffect, useState } from "react";
import { App } from "@capacitor/app";

export default function About() {
  const { t } = useLanguageContext();
  const { isNative } = usePlatform();
  const { needRefresh, updateServiceWorker } = usePWARefresh();
  const [nativeVersion, setNativeVersion] = useState<string | null>(null);

  useEffect(() => {
    if (isNative) {
      App.getInfo().then((info) => setNativeVersion(info.version));
    }
  }, [isNative]);

  return (
    <Page>
      <LargeNavbar title={t("about")} showBackButton={true} />
      <div className="prose prose-sm p-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Hvsna</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            v{nativeVersion ?? packageInfo.version}
          </p>
          <p>{t("about_description")}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <button
              onClick={() =>
                window.open("https://hvsna.com/changelog", "_blank")
              }
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-gray-900 dark:text-gray-100">
                {t("changelog") || "Changelog"}
              </span>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button
              onClick={() => window.open("https://hvsna.com", "_blank")}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-gray-900 dark:text-gray-100">
                {t("website") || "Website"}
              </span>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button
              onClick={() => window.open("https://hvsna.com/privacy", "_blank")}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-gray-900 dark:text-gray-100">
                {t("privacy_policy") || "Privacy Policy"}
              </span>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button
              onClick={() => window.open("https://hvsna.com/terms", "_blank")}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-gray-900 dark:text-gray-100">
                {t("terms_of_service") || "Terms of Service"}
              </span>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {!isNative && needRefresh && (
          <div
            className="border rounded-lg p-4 flex items-center justify-between gap-4"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--hvsna-primary-color, #5A4A7A) 10%, transparent)",
              borderColor:
                "color-mix(in srgb, var(--hvsna-primary-color, #5A4A7A) 30%, transparent)",
            }}
          >
            <p
              className="text-sm m-0"
              style={{ color: "var(--hvsna-primary-color, #5A4A7A)" }}
            >
              {t("update_available")}
            </p>
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white rounded-md shrink-0"
              style={{
                backgroundColor: "var(--hvsna-primary-color, #5A4A7A)",
              }}
            >
              <HvRefreshCw size={14} />
              {t("update_now")}
            </button>
          </div>
        )}
      </div>
    </Page>
  );
}
