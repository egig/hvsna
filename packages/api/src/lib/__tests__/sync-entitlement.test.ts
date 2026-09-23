import { describe, expect, it } from "vitest";
import { hasSyncEntitlement } from "../sync-entitlement";

const now = new Date("2026-09-23T00:00:00Z");
const future = new Date("2026-10-23T00:00:00Z");
const past = new Date("2026-08-23T00:00:00Z");

describe("hasSyncEntitlement", () => {
  it("is false without a subscription", () => {
    expect(hasSyncEntitlement(null, now)).toBe(false);
    expect(hasSyncEntitlement(undefined, now)).toBe(false);
  });

  it.each(["on_trial", "active", "past_due"])("is true for %s", (status) => {
    expect(hasSyncEntitlement({ status, endsAt: null }, now)).toBe(true);
  });

  it.each(["paused", "unpaid", "expired", "something_new"])("is false for %s", (status) => {
    expect(hasSyncEntitlement({ status, endsAt: future }, now)).toBe(false);
  });

  it("keeps a cancelled subscription entitled until ends_at", () => {
    expect(hasSyncEntitlement({ status: "cancelled", endsAt: future }, now)).toBe(true);
    expect(hasSyncEntitlement({ status: "cancelled", endsAt: past }, now)).toBe(false);
    expect(hasSyncEntitlement({ status: "cancelled", endsAt: null }, now)).toBe(false);
  });
});
