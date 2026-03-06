import log from "loglevel";

// Store original MODE for testing
let originalMode = import.meta.env.MODE;

/**
 * Configure loglevel based on environment
 * Development: DEBUG level (all logs)
 * Production: ERROR level (only errors)
 * Test: WARN level (warnings and errors)
 */
export const configureLogger = (): void => {
  // Use stored original mode or current mode
  const mode = originalMode || import.meta.env.MODE;
  const isDevelopment = mode === "development";
  const isProduction = mode === "production";

  if (isDevelopment) {
    log.setLevel("debug");
    log.info("Logger configured for development mode");
  } else if (isProduction) {
    log.setLevel("error");
    // Don't log in production to avoid console noise
  } else {
    // For test or other environments, use warn level
    log.setLevel("warn");
  }
};

/**
 * Set the original mode (for testing purposes)
 */
export const setOriginalMode = (mode: string): void => {
  originalMode = mode;
};

/**
 * Export configured logger instance
 */
export default log;

/**
 * Log levels available:
 * - trace: 0
 * - debug: 1
 * - info: 2
 * - warn: 3
 * - error: 4
 * - silent: 5
 */
