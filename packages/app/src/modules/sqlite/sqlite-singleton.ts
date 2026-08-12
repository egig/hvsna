import { SqliteClient } from "./client";

let clientInstance: SqliteClient | null = null;

/**
 * Get the singleton SqliteClient instance.
 * @returns SqliteClient instance
 */
export const getSqliteClient = (): SqliteClient => {
  if (!clientInstance) {
    clientInstance = new SqliteClient();
  }
  return clientInstance;
};

/**
 * Reset the singleton instance (useful for testing)
 */
export const resetSqliteClient = (): void => {
  if (clientInstance) {
    clientInstance.terminate();
    clientInstance = null;
  }
};
