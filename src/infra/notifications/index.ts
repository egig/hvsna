import { Capacitor } from "@capacitor/core";
import type { INotificationsProvider } from "../../domain/notifications/INotificationsProvider";
import { CapacitorNotificationsProvider } from "./CapacitorNotificationsProvider";
import { BrowserNotificationsProvider } from "./BrowserNotificationsProvider";

let notificationsInstance: INotificationsProvider | null = null;

export function initNotificationsProvider(p: INotificationsProvider): void {
  notificationsInstance = p;
}

export function createNotificationsProvider(): INotificationsProvider {
  if (notificationsInstance) return notificationsInstance;
  return Capacitor.isNativePlatform()
    ? new CapacitorNotificationsProvider()
    : new BrowserNotificationsProvider();
}
