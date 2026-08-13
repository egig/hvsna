import { useState } from "react";
import { AnnouncementBar } from "@/modules/components/announcement-bar";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";
import { useAuth } from "./use-auth";

/**
 * Global nag shown above the app (see app.tsx) whenever a signed-in user
 * hasn't verified their email yet — sync is blocked server-side until they
 * do (see requireVerifiedAuth on the API), so this is the one persistent
 * call to action rather than repeating it on every screen that touches sync.
 */
export function VerifyEmailBanner() {
  const { t } = useLanguageContext();
  const { user, resendVerification } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  if (!user || user.emailVerified) return null;

  const handleResend = async () => {
    setStatus("sending");
    try {
      await resendVerification();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <AnnouncementBar
      tone="warning"
      message={t("verify_email_required")}
      action={
        status === "sent" ? (
          <span className="font-medium">{t("verification_email_sent")}</span>
        ) : (
          <>
            <button
              onClick={handleResend}
              disabled={status === "sending"}
              className="font-medium underline hover:no-underline disabled:opacity-50"
            >
              {t("resend_verification_email")}
            </button>
            {status === "error" && (
              <span className="text-red-700">
                {t("verification_email_failed")}
              </span>
            )}
          </>
        )
      }
    />
  );
}
