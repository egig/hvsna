import { useState } from "react";
import { Database, Trash2, AlertTriangle } from "lucide-react";
import { usePouchDB } from "../contexts/PouchDB";
import { Navbar } from "../navigation/components/Navbar";

export default function DataManagement() {
  const { db } = usePouchDB();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleWipePouchDB = async () => {
    if (isDeleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete the entire PouchDB database? This will remove all stored data and cannot be undone.",
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // Destroy the entire database
      await db.destroy();

      alert(
        "PouchDB database has been successfully deleted. The app will need to be restarted to create a fresh database.",
      );

      // Optionally redirect or reload
      window.location.reload();
    } catch (error) {
      console.error("Error destroying database:", error);
      alert("An error occurred while deleting the database. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar title="Data Management" showBackButton />

      <main className="max-w-[520px] mx-auto px-4 py-6">
        {/* Warning Section */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                Warning
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                Data deletion is permanent
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                These actions cannot be undone. Please make sure you have
                backups if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Database Management
            </h2>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            This will permanently delete all notes, tasks, and other data stored
            in the local database.
          </p>

          <button
            onClick={handleWipePouchDB}
            disabled={isDeleting}
            className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 active:scale-95 transition-transform"
          >
            <Trash2 className="w-5 h-5" />
            <span>{isDeleting ? "Deleting..." : "Wipe All Data"}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
