import { WebSessionRepository } from "@/infra/auth/WebSessionRepository";
import { BrowserNotificationsProvider } from "@/infra/notifications/BrowserNotificationsProvider";
import { BrowserPermissionsProvider } from "@/infra/permissions/BrowserPermissionsProvider";
import { BrowserNetworkDriver } from "@/infra/network/BrowserNetworkDriver";
import { BrowserLocationDriver } from "@/infra/location/BrowserLocationDriver";
import { initAuthUseCases } from "@/infra/auth/AuthServiceFactory";
import { initNotificationsProvider } from "@/infra/notifications";
import { initPermissionsProvider } from "@/infra/permissions";
import { initNetworkProvider } from "@/infra/network";
import { initLocationProvider } from "@/infra/location/CapacitorLocationDriver";

export function registerWebImplementations(): void {
  initAuthUseCases(new WebSessionRepository());
  initNotificationsProvider(new BrowserNotificationsProvider());
  initPermissionsProvider(new BrowserPermissionsProvider());
  initNetworkProvider(new BrowserNetworkDriver());
  initLocationProvider(new BrowserLocationDriver());
}
