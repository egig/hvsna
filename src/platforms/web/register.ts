import { WebSessionRepository } from "@src/infra/auth/WebSessionRepository";
import { BrowserNotificationsProvider } from "@src/infra/notifications/BrowserNotificationsProvider";
import { BrowserPermissionsProvider } from "@src/infra/permissions/BrowserPermissionsProvider";
import { BrowserNetworkProvider } from "@src/infra/network/BrowserNetworkProvider";
import { BrowserLocationProvider } from "@src/infra/settings/BrowserLocationProvider";
import { initAuthUseCases } from "@src/infra/auth/AuthServiceFactory";
import { initNotificationsProvider } from "@src/infra/notifications";
import { initPermissionsProvider } from "@src/infra/permissions";
import { initNetworkProvider } from "@src/infra/network";
import { initLocationProvider } from "@src/infra/settings/CapacitorLocationProvider";

export function registerWebImplementations(): void {
  initAuthUseCases(new WebSessionRepository());
  initNotificationsProvider(new BrowserNotificationsProvider());
  initPermissionsProvider(new BrowserPermissionsProvider());
  initNetworkProvider(new BrowserNetworkProvider());
  initLocationProvider(new BrowserLocationProvider());
}
