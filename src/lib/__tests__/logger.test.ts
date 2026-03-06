import { describe, it, expect, beforeEach } from "vitest";
import log from "../logger";
import { configureLogger, setOriginalMode } from "../logger";

describe("Logger Configuration", () => {
  beforeEach(() => {
    // Reset log level before each test
    log.setLevel("debug");
  });

  it("should configure logger for development mode", () => {
    setOriginalMode("development");
    configureLogger();
    expect(log.getLevel()).toBe(1); // debug level
  });

  it("should configure logger for production mode", () => {
    setOriginalMode("production");
    configureLogger();
    expect(log.getLevel()).toBe(4); // error level
  });

  it("should configure logger for test mode", () => {
    setOriginalMode("test");
    configureLogger();
    expect(log.getLevel()).toBe(3); // warn level
  });

  it("should have all log methods available", () => {
    expect(typeof log.trace).toBe("function");
    expect(typeof log.debug).toBe("function");
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
  });
});
