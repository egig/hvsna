const RESEND_API_URL = "https://api.resend.com/emails";

function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? "HVSNA <onboarding@resend.dev>";
}

function verificationEmailHtml(verifyUrl: string): string {
  return `<p>Welcome to HVSNA! Please confirm your email address to enable sync across devices.</p>
<p><a href="${verifyUrl}">Verify your email</a></p>
<p>Or paste this link into your browser: ${verifyUrl}</p>
<p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`;
}

/**
 * Sends the verification email via Resend's HTTP API directly (no SDK
 * dependency needed for a single JSON POST). If RESEND_API_KEY isn't set
 * (e.g. local dev without an account), logs the link instead of sending —
 * registration must not fail just because email isn't configured.
 */
export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set; verification link for ${to}: ${verifyUrl}`);
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to,
      subject: "Verify your email",
      html: verificationEmailHtml(verifyUrl),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send verification email (${response.status}): ${body}`);
  }
}
