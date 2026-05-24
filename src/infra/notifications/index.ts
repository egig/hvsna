import { Capacitor } from "@capacitor/core";
import type { INotificationsDriver } from "../../domain/notifications/INotificationsProvider";
import { CapacitorNotificationsDriver } from "./CapacitorNotificationsDriver";
import { BrowserNotificationsDriver } from "./BrowserNotificationsDriver";

let notificationsInstance: INotificationsDriver | null = null;

export function initNotificationsProvider(p: INotificationsDriver): void {
  notificationsInstance = p;
}

export function createNotificationsDriver(): INotificationsDriver {
  if (notificationsInstance) return notificationsInstance;
  return Capacitor.isNativePlatform()
    ? new CapacitorNotificationsDriver()
    : new BrowserNotificationsDriver();
}
