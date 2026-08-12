/**
 * Cross-platform UUID generation utility
 * Provides consistent UUID generation across different environments
 */

/**
 * Generate a UUID v4 using the best available method
 * Falls back to a simple implementation if crypto.randomUUID is not available
 */
export function generateUUID(): string {
  // Try to use the native crypto.randomUUID if available (modern browsers, Node.js)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a prefixed UUID for specific entity types
 * @param prefix - The prefix to add (e.g., 'task_', 'goal_', 'log_')
 * @returns A prefixed UUID string
 */
export function generatePrefixedUUID(prefix: string): string {
  return `${prefix}${generateUUID()}`;
}

/**
 * Default export for convenience
 */
export default generateUUID;
