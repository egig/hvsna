export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class SessionExpiredError extends AuthError {
  constructor() {
    super("SESSION_EXPIRED", "Session has expired");
  }
}

export class NoSessionError extends AuthError {
  constructor() {
    super("NO_SESSION", "No active session");
  }
}
