import { WebSessionRepository } from "@/infra/auth/WebSessionRepository";
import { BrowserNotificationsProvider } from "@/infra/notifications/BrowserNotificationsProvider";
import { BrowserPermissionsProvider } from "@/infra/permissions/BrowserPermissionsProvider";
import { BrowserNetworkProvider } from "@/infra/network/BrowserNetworkProvider";
import { BrowserLocationProvider } from "@/infra/settings/BrowserLocationProvider";
import { initAuthUseCases } from "@/infra/auth/AuthServiceFactory";
import { initNotificationsProvider } from "@/infra/notifications";
import { initPermissionsProvider } from "@/infra/permissions";
import { initNetworkProvider } from "@/infra/network";
import { initLocationProvider } from "@/infra/settings/CapacitorLocationProvider";

export function registerWebImplementations(): void {
  initAuthUseCases(new WebSessionRepository());
  initNotificationsProvider(new BrowserNotificationsProvider());
  initPermissionsProvider(new BrowserPermissionsProvider());
  initNetworkProvider(new BrowserNetworkProvider());
  initLocationProvider(new BrowserLocationProvider());
}
