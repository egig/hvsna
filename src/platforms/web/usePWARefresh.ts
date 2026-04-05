import { useRegisterSW } from "virtual:pwa-register/react";

export function usePWARefresh() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  return { needRefresh, updateServiceWorker };
}
