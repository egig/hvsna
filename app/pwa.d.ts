declare module 'virtual:pwa-register' {
  export function registerSW(options?: {
    onOfflineReady?: () => void;
    onNeedRefresh?: () => void;
    onOffline?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration) => void;
    onRegisterError?: (error: any) => void;
  }): () => void;
}
