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
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16 lg:py-32">
          <h1 className="text-4xl sm:text-5xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Delete Your Account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">Account deletion is permanent and cannot be undone.</p>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            You have the right to delete your Hvsna account and all associated data at any time. Once your account
            is deleted, all your personal information, settings, and data will be permanently removed from our
            systems and cannot be recovered.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">How to Delete Your Account</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            Follow these steps to permanently delete your Hvsna account from within the app:
          </p>
          <ol className="list-decimal list-inside text-lg text-gray-600 dark:text-gray-300 mb-8 space-y-3 pl-4">
            <li>
              Open the <strong className="text-gray-900 dark:text-white">Hvsna</strong> app on your device.
            </li>
            <li>
              Tap your profile icon or go to <strong className="text-gray-900 dark:text-white">Settings</strong>.
            </li>
            <li>
              Scroll down and tap <strong className="text-gray-900 dark:text-white">Account</strong>.
            </li>
            <li>
              Tap <strong className="text-gray-900 dark:text-white">Delete Account</strong>.
            </li>
            <li>
              Read the confirmation message and tap <strong className="text-gray-900 dark:text-white">Confirm Delete</strong> to proceed.
            </li>
          </ol>

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
              If you have an active subscription, deleting your account will not automatically cancel your
              subscription. Please cancel your subscription through the App Store or Google Play before deleting
              your account.
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
