export interface ITimezoneProvider {
  getTimezone(latitude: number, longitude: number): Promise<string | null>;
}
