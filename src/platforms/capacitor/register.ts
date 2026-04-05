import { CapacitorSessionRepository } from "@src/infra/auth/CapacitorSessionRepository";
import { CapacitorNotificationsProvider } from "@src/infra/notifications/CapacitorNotificationsProvider";
import { CapacitorPermissionsProvider } from "@src/infra/permissions/CapacitorPermissionsProvider";
import { CapacitorNetworkProvider } from "@src/infra/network/CapacitorNetworkProvider";
import { NativeLocationProvider } from "@src/infra/settings/NativeLocationProvider";
import { initAuthUseCases } from "@src/infra/auth/AuthServiceFactory";
import { initNotificationsProvider } from "@src/infra/notifications";
import { initPermissionsProvider } from "@src/infra/permissions";
import { initNetworkProvider } from "@src/infra/network";
import { initLocationProvider } from "@src/infra/settings/CapacitorLocationProvider";

export function registerCapacitorImplementations(): void {
  initAuthUseCases(new CapacitorSessionRepository());
  initNotificationsProvider(new CapacitorNotificationsProvider());
  initPermissionsProvider(new CapacitorPermissionsProvider());
  initNetworkProvider(new CapacitorNetworkProvider());
  initLocationProvider(new NativeLocationProvider());
}
