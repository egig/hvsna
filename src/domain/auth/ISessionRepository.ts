export interface ISessionRepository {
  getRefreshToken(): Promise<string | null>;
  saveRefreshToken(token: string): Promise<void>;
  clearRefreshToken(): Promise<void>;
}
