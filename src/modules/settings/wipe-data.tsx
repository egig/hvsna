import { useState } from "react";
import { Database, Trash2, AlertTriangle } from "lucide-react";
import { usePouchDB } from "../../pouchdb";
import { Navbar, Page } from "../navigation";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";

export default function WipeData() {
  const { t } = useLanguageContext();
  const { db } = usePouchDB();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleWipePouchDB = async () => {
    if (isDeleting) return;

    const confirmed = window.confirm(t("confirm_delete_database"));

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // Destroy the entire database
      await db.destroy();

      alert(t("database_deleted"));

      // Optionally redirect or reload
      window.location.reload();
    } catch (error) {
      console.error("Error destroying database:", error);
      alert(t("error_deleting_database"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Page>
      <Navbar title={t("reset_device_data")} showBackButton />

      <main className="max-w-[520px] mx-auto px-4 py-6">
        {/* Warning Section */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                {t("warning")}
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                {t("data_deletion_permanent")}
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                {t("actions_cannot_be_undone")}
              </p>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {t("reset_device_data_subtitle")}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {t("delete_all_data")}
          </p>

          <button
            onClick={handleWipePouchDB}
            disabled={isDeleting}
            className="w-full flex items-center justify-center space-x-2 bg-[var(--hvsna-danger-color)] hover:bg-[var(--hvsna-danger-color-hover)] disabled:bg-[var(--hvsna-danger-color-pressed)] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 active:scale-95 transition-transform"
          >
            <Trash2 className="w-5 h-5" />
            <span>{isDeleting ? t("deleting") : t("wipe_all_data")}</span>
          </button>
        </div>
      </main>
    </Page>
  );
}
