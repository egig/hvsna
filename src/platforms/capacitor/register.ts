import { CapacitorSessionRepository } from "@/infra/auth/CapacitorSessionRepository";
import { CapacitorNotificationsDriver } from "@/infra/notifications/CapacitorNotificationsDriver";
import { CapacitorPermissionsProvider } from "@/infra/permissions/CapacitorPermissionsProvider";
import { CapacitorNetworkDriver } from "@/infra/network/CapacitorNetworkDriver";
import { NativeLocationDriver } from "@/infra/location/NativeLocationProvider";
import { initAuthUseCases } from "@/infra/auth/AuthServiceFactory";
import { initNotificationsProvider } from "@/infra/notifications";
import { initPermissionsProvider } from "@/infra/permissions";
import { initNetworkProvider } from "@/infra/network";
import { initLocationProvider } from "@/infra/location/CapacitorLocationDriver";

export function registerCapacitorImplementations(): void {
  initAuthUseCases(new CapacitorSessionRepository());
  initNotificationsProvider(new CapacitorNotificationsDriver());
  initPermissionsProvider(new CapacitorPermissionsProvider());
  initNetworkProvider(new CapacitorNetworkDriver());
  initLocationProvider(new NativeLocationDriver());
}
