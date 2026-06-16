import { WebSessionRepository } from "@/infra/auth/WebSessionRepository";
import { BrowserNotificationsDriver } from "@/infra/notifications/BrowserNotificationsDriver";
import { BrowserPermissionsProvider } from "@/infra/permissions/BrowserPermissionsProvider";
import { BrowserNetworkDriver } from "@/infra/network/BrowserNetworkDriver";
import { BrowserLocationDriver } from "@/infra/location/BrowserLocationDriver";
import { initAuthService } from "@/infra/auth/AuthServiceFactory";
import { initNotificationsProvider } from "@/infra/notifications";
import { initPermissionsProvider } from "@/infra/permissions";
import { initNetworkProvider } from "@/infra/network";
import { initLocationProvider } from "@/infra/location/CapacitorLocationDriver";

export function registerWebImplementations(): void {
  initAuthService(new WebSessionRepository());
  initNotificationsProvider(new BrowserNotificationsDriver());
  initPermissionsProvider(new BrowserPermissionsProvider());
  initNetworkProvider(new BrowserNetworkDriver());
  initLocationProvider(new BrowserLocationDriver());
}
