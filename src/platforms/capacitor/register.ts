import { CapacitorSessionRepository } from "@/infra/auth/CapacitorSessionRepository";
import { CapacitorNotificationsProvider } from "@/infra/notifications/CapacitorNotificationsProvider";
import { CapacitorPermissionsProvider } from "@/infra/permissions/CapacitorPermissionsProvider";
import { CapacitorNetworkProvider } from "@/infra/network/CapacitorNetworkProvider";
import { NativeLocationProvider } from "@/infra/location/NativeLocationProvider";
import { initAuthUseCases } from "@/infra/auth/AuthServiceFactory";
import { initNotificationsProvider } from "@/infra/notifications";
import { initPermissionsProvider } from "@/infra/permissions";
import { initNetworkProvider } from "@/infra/network";
import { initLocationProvider } from "@/infra/location/CapacitorLocationProvider";

export function registerCapacitorImplementations(): void {
  initAuthUseCases(new CapacitorSessionRepository());
  initNotificationsProvider(new CapacitorNotificationsProvider());
  initPermissionsProvider(new CapacitorPermissionsProvider());
  initNetworkProvider(new CapacitorNetworkProvider());
  initLocationProvider(new NativeLocationProvider());
}
