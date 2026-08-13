// Rendered outside the language/settings provider tree (see
// SqliteProvider — it wraps them), so text here is hardcoded English rather
// than run through useLanguageContext(), matching the same constraint on
// ErrorBoundary's fallback UI.
export function DatabaseLockedOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
      <div className="max-w-sm w-full mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Already open in another tab
        </h1>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          To keep your data safe, this app can only be active in one tab at a
          time. Close the other tab, or switch to it — this one will
          continue automatically as soon as it's free.
        </p>

        <div
          className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500"
          role="status"
        >
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Waiting for the other tab…
        </div>
      </div>
    </div>
  );
}
