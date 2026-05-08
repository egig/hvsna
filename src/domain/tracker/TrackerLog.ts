export interface TrackerLog {
  id: string;
  trackerId: string;
  value: number;
  note?: string;
  occurredAt: number; // timestamp
  createdAt: number;
  updatedAt: number;
}

export interface TrackerLogCreateInput {
  trackerId: string;
  value: number;
  note?: string;
  occurredAt?: number;
}

export interface TrackerLogUpdateInput {
  value?: number;
  note?: string;
  occurredAt?: number;
}

export interface TrackerLogQuery {
  trackerId?: string;
  startTime?: number;
  endTime?: number;
}
