import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { VerifyEmailBanner } from "../verify-email-banner";

const mockResendVerification = vi.fn();
let mockUser: { emailVerified: boolean } | null = null;

vi.mock("../use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    resendVerification: mockResendVerification,
  }),
}));

vi.mock("@/modules/i18n/LanguageContext", () => ({
  useLanguageContext: () => ({
    t: (key: string) => key,
  }),
}));

beforeEach(() => {
  mockUser = null;
  mockResendVerification.mockReset();
});

describe("VerifyEmailBanner", () => {
  it("renders nothing when signed out", () => {
    mockUser = null;
    const { container } = render(<VerifyEmailBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing once the user's email is verified", () => {
    mockUser = { emailVerified: true };
    const { container } = render(<VerifyEmailBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the resend prompt for a signed-in, unverified user", () => {
    mockUser = { emailVerified: false };
    render(<VerifyEmailBanner />);

    expect(screen.getByText("verify_email_required")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "resend_verification_email" })
    ).toBeInTheDocument();
  });

  it("shows a confirmation after a successful resend", async () => {
    mockUser = { emailVerified: false };
    mockResendVerification.mockResolvedValue(undefined);
    render(<VerifyEmailBanner />);

    fireEvent.click(
      screen.getByRole("button", { name: "resend_verification_email" })
    );

    expect(mockResendVerification).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByText("verification_email_sent")).toBeInTheDocument()
    );
  });

  it("shows an error message when the resend fails", async () => {
    mockUser = { emailVerified: false };
    mockResendVerification.mockRejectedValue(new Error("network error"));
    render(<VerifyEmailBanner />);

    fireEvent.click(
      screen.getByRole("button", { name: "resend_verification_email" })
    );

    await waitFor(() =>
      expect(
        screen.getByText("verification_email_failed")
      ).toBeInTheDocument()
    );
    // The resend button remains so the user can retry.
    expect(
      screen.getByRole("button", { name: "resend_verification_email" })
    ).toBeInTheDocument();
  });
});
