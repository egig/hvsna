import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SUPPORT_EMAIL } from "@/config";
import { useSeo } from "@/seo/Seo";

export default function OptOutPage() {
  useSeo();
  return (
    <div className="min-h-screen">
      <Header currentLang="en" />
      <main>
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Delete Your Account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">Account deletion is permanent and cannot be undone.</p>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            You have the right to delete your Hvsna account and all associated data at any time. Once your account
            is deleted, all your personal information, settings, and data will be permanently removed from our
            systems and cannot be recovered.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">How to Delete Your Account</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            To permanently delete your Hvsna account and its synced data, email us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Account%20deletion%20request`} className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            from the address on your account, with the subject "Account deletion request". We process
            deletion requests within 30 days and email you when it's done.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            To remove Hvsna's data from a single device without deleting your account, open{" "}
            <strong className="text-gray-900 dark:text-white">Settings → Reset Device Data</strong> in the app.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">What Gets Deleted</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
            When you delete your account, the following data will be permanently removed:
          </p>
          <ul className="list-disc list-inside text-lg text-gray-600 dark:text-gray-300 mb-8 space-y-2 pl-4">
            <li>Your profile information (name, email address)</li>
            <li>All personal settings and preferences</li>
            <li>All activity history and records stored in the app</li>
            <li>Any subscription or billing information linked to your account</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">Before You Delete</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">Please note the following before proceeding:</p>
          <ul className="list-disc list-inside text-lg text-gray-600 dark:text-gray-300 mb-8 space-y-2 pl-4">
            <li>
              Account deletion is <strong className="text-gray-900 dark:text-white">permanent and irreversible</strong>. There is no way to
              recover your account or data afterwards.
            </li>
            <li>
              If you have an active Sync subscription, cancel it first from{" "}
              <strong className="text-gray-900 dark:text-white">Settings → Subscription → Manage Subscription</strong>{" "}
              (the Lemon Squeezy customer portal). Deleting your account does not automatically cancel billing.
            </li>
            <li>
              Data may be retained for a limited period as required by law or for legitimate business purposes as
              described in our{" "}
              <a href="/privacy" className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
                Privacy Policy
              </a>
              .
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">Need Help?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            If you are unable to access the app or encounter any issues deleting your account, please contact us
            directly at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            and we will process your deletion request within 30 days.
          </p>
        </article>
      </main>
      <Footer currentLang="en" />
    </div>
  );
}
