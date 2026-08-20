export class AuthError extends Error {
  constructor(public readonly code: string, message: string) {
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

/**
 * Thrown when /auth/refresh could not be reached or answered (network
 * error, timeout, 5xx) as opposed to the server explicitly rejecting the
 * refresh token. Callers must NOT clear the stored refresh token on this
 * error — the session may still be valid, just unreachable right now.
 */
export class RefreshUnavailableError extends AuthError {
  constructor() {
    super(
      "REFRESH_UNAVAILABLE",
      "Could not reach the server to refresh the session"
    );
  }
}
