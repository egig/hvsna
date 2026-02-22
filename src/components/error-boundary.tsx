import React, { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { ErrorBoundary as RollbarErrorBoundary } from "@rollbar/react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

function ErrorBoundaryContent({ children, fallback }: Props) {
  const [errorState, setErrorState] = useState<State>({
    hasError: false,
    error: null,
    errorInfo: null,
  });

  const handleError = useCallback((error: Error, errorInfo: any) => {
    setErrorState({
      hasError: true,
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV !== "production") {
      console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }
  }, []);

  const handleReset = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  }, []);

  if (errorState.hasError) {
    // Custom fallback UI
    if (fallback) {
      return fallback;
    }

    const isDevelopment = process.env.NODE_ENV !== "production";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>

          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            {isDevelopment
              ? "An unexpected error occurred. Check the console for details."
              : "An unexpected error occurred. Please try refreshing the page."}
          </p>

          {isDevelopment && errorState.error && (
            <div className="mb-6">
              <details className="bg-gray-100 dark:bg-gray-700 rounded p-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Error Details
                </summary>
                <div className="mt-2 text-xs">
                  <div className="mb-2">
                    <strong className="text-gray-700 dark:text-gray-300">
                      Error:
                    </strong>
                    <pre className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-800 dark:text-red-400 overflow-auto">
                      {errorState.error.toString()}
                    </pre>
                  </div>

                  {errorState.errorInfo && (
                    <div>
                      <strong className="text-gray-700 dark:text-gray-300">
                        Component Stack:
                      </strong>
                      <pre className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-800 dark:text-red-400 overflow-auto">
                        {errorState.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export function ErrorBoundary({ children, fallback }: Props) {
  return (
    <RollbarErrorBoundary>
      <ErrorBoundaryContent fallback={fallback}>
        {children}
      </ErrorBoundaryContent>
    </RollbarErrorBoundary>
  );
}
