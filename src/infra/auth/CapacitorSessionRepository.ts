import { Preferences } from "@capacitor/preferences";
import type { ISessionRepository } from "../../domain/auth/ISessionRepository";

const REFRESH_TOKEN_KEY = "auth_refresh_token";

export class CapacitorSessionRepository implements ISessionRepository {
  async getRefreshToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY });
    return value;
  }

  async saveRefreshToken(token: string): Promise<void> {
    await Preferences.set({ key: REFRESH_TOKEN_KEY, value: token });
  }

  async clearRefreshToken(): Promise<void> {
    await Preferences.remove({ key: REFRESH_TOKEN_KEY });
  }
}
