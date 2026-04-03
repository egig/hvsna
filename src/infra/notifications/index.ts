import { Capacitor } from "@capacitor/core";
import type { INotificationsProvider } from "../../domain/notifications/INotificationsProvider";
import { CapacitorNotificationsProvider } from "./CapacitorNotificationsProvider";
import { BrowserNotificationsProvider } from "./BrowserNotificationsProvider";

export function createNotificationsProvider(): INotificationsProvider {
  return Capacitor.isNativePlatform()
    ? new CapacitorNotificationsProvider()
    : new BrowserNotificationsProvider();
}
