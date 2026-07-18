import type { INotificationsDriver } from "../../domain/notifications/INotificationsProvider";
import { BrowserNotificationsDriver } from "./BrowserNotificationsDriver";

let notificationsInstance: INotificationsDriver | null = null;

export function initNotificationsProvider(p: INotificationsDriver): void {
  notificationsInstance = p;
}

export function createNotificationsDriver(): INotificationsDriver {
  if (notificationsInstance) return notificationsInstance;
  return new BrowserNotificationsDriver();
}
