export function usePWARefresh() {
  return {
    needRefresh: false,
    updateServiceWorker: async (_reloadPage?: boolean) => {},
  };
}
