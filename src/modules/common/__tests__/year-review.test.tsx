import { describe, it, expect, vi } from "vitest";

// Simple test to verify the component exports correctly
describe("YearReview Component", () => {
  it("should be defined", async () => {
    const { YearReview } = await import("../year-review");
    expect(YearReview).toBeDefined();
    expect(typeof YearReview).toBe("function");
  });

  it("should have correct component structure", async () => {
    const { YearReview } = await import("../year-review");

    // Verify the component is a React component
    expect(YearReview.name).toBe("YearReview");
  });
});
