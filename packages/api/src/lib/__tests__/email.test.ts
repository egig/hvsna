import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendVerificationEmail } from "../email";

const ORIGINAL_RESEND_API_KEY = process.env.RESEND_API_KEY;
const ORIGINAL_EMAIL_FROM = process.env.EMAIL_FROM;

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  process.env.RESEND_API_KEY = ORIGINAL_RESEND_API_KEY;
  process.env.EMAIL_FROM = ORIGINAL_EMAIL_FROM;
});

describe("sendVerificationEmail", () => {
  it("logs the link instead of sending when RESEND_API_KEY is unset", async () => {
    delete process.env.RESEND_API_KEY;
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await sendVerificationEmail("person@example.com", "https://app.test/verify-email?token=abc");

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("person@example.com"));
  });

  it("posts to the Resend API with the configured API key when set", async () => {
    process.env.RESEND_API_KEY = "test-key";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await sendVerificationEmail("person@example.com", "https://app.test/verify-email?token=abc");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      })
    );
  });

  it("throws when Resend responds with a non-2xx status", async () => {
    process.env.RESEND_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 422 })
    );

    await expect(
      sendVerificationEmail("person@example.com", "https://app.test/verify-email?token=abc")
    ).rejects.toThrow(/422/);
  });
});
