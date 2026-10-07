import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SUPPORT_EMAIL } from "@/config";
import { useSeo } from "@/seo/Seo";

export default function PrivacyPage() {
  useSeo();
  return (
    <div className="min-h-screen">
      <Header currentLang="en" />
      <main>
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">Last Updated: March 3, 2026</p>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            This Privacy Policy (&quot;Policy&quot;) explains how Hvsna (&quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;) collect, use, disclose, and safeguard your personal information when you access and use
            our application (&quot;App&quot; or &quot;Service&quot;). By using our App, you consent to the practices
            described in this Policy. Please read this Policy carefully to understand our practices regarding your
            personal information.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">1. Information We Collect</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            1.1 <strong className="text-gray-900 dark:text-white">No accounts:</strong> Hvsna does not have user
            accounts, and we do not ask for your name, email address, or other identifying information to use the
            App.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            1.2 <strong className="text-gray-900 dark:text-white">Data stored on your device:</strong> The tasks,
            tags, settings, and location you enter or allow the App to use are stored only on your device. We do not
            receive, store, or have access to this data. Your approximate location is used on the device to calculate
            prayer times and your timezone.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            1.3 <strong className="text-gray-900 dark:text-white">Distribution platforms and this website:</strong>{" "}
            The App is distributed through Google Play, which may collect its own usage and diagnostic data under its
            own policies. The App also uses Firebase Crashlytics to send anonymous crash reports (such as device model,
            OS version, and the crash stack trace) so we can fix bugs; these reports do not include your tasks. This website is hosted on GitHub Pages, which may log technical information such as your IP
            address when you visit. We do not run analytics or advertising trackers.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">2. How We Use Your Information</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
            2.1 We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc list-inside text-lg text-gray-600 dark:text-gray-300 mb-8 space-y-2 pl-4">
            <li>To provide and maintain the App on your device, such as calculating prayer times and scheduling reminders</li>
            <li>To respond to your inquiries, comments, or feedback sent to our support email</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">3. Information Sharing and Disclosure</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
            3.1 We may share your personal information in the following circumstances:
          </p>
          <ul className="list-disc list-inside text-lg text-gray-600 dark:text-gray-300 mb-8 space-y-2 pl-4">
            <li>To comply with legal obligations, enforce our Terms of Service, and protect our rights or the rights of others</li>
            <li>
              In the event of a business transfer, such as a merger, acquisition, or sale, where your information may
              be part of the assets transferred
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">4. Data Security</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            4.1 We implement reasonable measures to protect your personal information from unauthorized access,
            disclosure, alteration, or destruction. However, no method of transmission over the internet or
            electronic storage is completely secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">5. Retention of Information</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            5.1 We will retain your personal information for as long as necessary to fulfill the purposes outlined in
            this Policy, or as required by law.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">6. Third-Party Links and Services</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            6.1 Our App may contain links to third-party websites or services. We are not responsible for the
            privacy practices or content of such third-party websites or services. We encourage you to review the
            privacy policies of these third parties before providing any personal information to them.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">7. Children&apos;s Privacy</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            7.1 Our App is not intended for use by individuals under the age of 13. We do not knowingly collect
            personal information from children under 13 years of age. If you are a parent or guardian and believe
            that your child has provided us with personal information, please contact us, and we will promptly
            delete such information.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">8. Changes to the Privacy Policy</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            8.1 We may update this Privacy Policy from time to time, and any changes will be posted on this page.
            Your continued use of the App after any modifications to this Policy signifies your acceptance of the
            updated terms.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">9. Contact Us</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            9.1 If you have any questions or concerns about this Privacy Policy or our data practices, please contact
            us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>

          <p className="text-lg text-gray-600 dark:text-gray-300 mt-12 leading-relaxed">
            By using our App, you acknowledge that you have read, understood, and agreed to this Privacy Policy.
          </p>
        </article>
      </main>
      <Footer currentLang="en" />
    </div>
  );
}
