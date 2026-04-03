export interface ITokenStore {
  getAccessToken(): string | null;
  setAccessToken(token: string): void;
  clearAccessToken(): void;
  getAuthHeader(): { Authorization: string } | Record<string, never>;
}
