import { useRegisterSW } from "virtual:pwa-register/react";
import { HvRefreshCw } from "@src/modules/icons";
import { Page } from "../navigation";
import packageInfo from "../../../package.json";
import { LargeNavbar } from "../navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import { usePlatform } from "../platform";

export default function About() {
  const { t } = useLanguageContext();
  const { isNative } = usePlatform();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <Page>
      <LargeNavbar title={t("about")} showBackButton={true} />
      <div className="prose prose-sm p-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Hvsna</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            v{packageInfo.version}
          </p>
          <p>{t("about_description")}</p>
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
