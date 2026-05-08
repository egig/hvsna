export class TrackerNotFoundError extends Error {
  constructor(id: string) {
    super(`Tracker with id ${id} not found`);
    this.name = "TrackerNotFoundError";
  }
}

export class TrackerLogNotFoundError extends Error {
  constructor(id: string) {
    super(`Tracker log with id ${id} not found`);
    this.name = "TrackerLogNotFoundError";
  }
}

export class InvalidTrackerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTrackerError";
  }
}
