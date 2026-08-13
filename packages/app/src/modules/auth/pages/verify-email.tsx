import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Page } from "src/modules/navigation";
import { Navbar } from "src/modules/navigation";
import Block from "src/modules/components/block";
import { useAuth } from "../use-auth";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token, verifyEmail]);

  return (
    <Page>
      <Navbar title="Verify Email" />
      <Block>
        <div className="mx-auto w-full max-w-md text-center">
          {status === "verifying" && (
            <>
              <h1 className="text-2xl font-bold text-primary-900 mb-2">
                Verifying your email…
              </h1>
              <p className="text-primary-600">This will only take a moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <h1 className="text-2xl font-bold text-primary-900 mb-2">
                Email verified
              </h1>
              <p className="text-primary-600 mb-6">
                Your email is confirmed. Sync is now available on this account.
              </p>
              <Link
                to="/"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Continue
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <h1 className="text-2xl font-bold text-primary-900 mb-2">
                Verification link invalid
              </h1>
              <p className="text-primary-600 mb-6">
                This link is invalid or has expired. You can request a new one
                from the Sync settings screen after signing in.
              </p>
              <Link
                to="/signin"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </Block>
    </Page>
  );
}
