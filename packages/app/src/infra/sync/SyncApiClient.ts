import type {
  SyncPullCursors,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
} from "./types";

export interface BaseResponse<T> {
  code: string;
  message: string;
  data: T;
}

/** Minimal HTTP interface — mirrors AuthService's AuthHttpPort, no axios dependency here. */
export interface SyncHttpPort {
  post<T>(url: string, data?: unknown): Promise<T>;
  get<T>(url: string): Promise<T>;
}

export class SyncApiClient {
  constructor(private readonly http: SyncHttpPort) {}

  async push(body: SyncPushRequest): Promise<SyncPushResponse> {
    const response = await this.http.post<BaseResponse<SyncPushResponse>>("/sync/push", body);
    return response.data;
  }

  async pull(cursors: SyncPullCursors, limit: number): Promise<SyncPullResponse> {
    const params = new URLSearchParams({
      tasks_cursor: String(cursors.tasks),
      recurring_tasks_cursor: String(cursors.recurring_tasks),
      settings_cursor: String(cursors.settings),
      tags_cursor: String(cursors.tags),
      limit: String(limit),
    });
    const response = await this.http.get<BaseResponse<SyncPullResponse>>(
      `/sync/pull?${params.toString()}`
    );
    return response.data;
  }
}
