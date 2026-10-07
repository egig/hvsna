import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SUPPORT_EMAIL } from "@/config";
import { useSeo } from "@/seo/Seo";

export default function TermsPage() {
  useSeo();
  return (
    <div className="min-h-screen">
      <Header currentLang="en" />
      <main>
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">Last Updated: June 2, 2026</p>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            These Terms of Service (&quot;Terms&quot;) govern the use of the Hvsna application (&quot;App&quot; or
            &quot;Service&quot;) provided by Hvsna (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing
            or using our App, you agree to be bound by these Terms. If you do not agree to these Terms, please
            refrain from using our Service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">1. Eligibility</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            1.1 You must be at least 18 years old or of legal age in your jurisdiction to enter into this agreement.
            The App does not require an account.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">2. Use of the App</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            2.1 Our App is provided for personal use. You may not use the App for any unauthorized or illegal
            purpose.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            2.2 You are responsible for any content you create or store using the App. Your content is stored only on your device, and you retain all rights to it. We do not access or receive it. You are responsible for keeping your own backups.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">3. Prohibited Conduct</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
            3.1 You agree not to engage in any of the following activities while using our App:
          </p>
          <ul className="list-disc list-inside text-lg text-gray-600 dark:text-gray-300 mb-8 space-y-2 pl-4">
            <li>Violating any applicable law or regulation</li>
            <li>Interfering with the security of the App or attempting to gain unauthorized access to our systems</li>
            <li>
              Uploading, transmitting, or distributing any content that is unlawful, harmful, defamatory, infringing,
              or otherwise objectionable
            </li>
            <li>Impersonating any person or entity or misrepresenting your affiliation with any person or entity</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">4. Pricing</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            4.1 The App is currently free to use. We may introduce paid features in the future; if we do, we will
            update these Terms and the terms of purchase will be shown at the time of purchase.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">5. Intellectual Property</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            5.1 We retain all right, title, and interest in and to the App, including all related intellectual
            property rights. You acknowledge that the App and any underlying technology may contain confidential and
            proprietary information that is protected by applicable intellectual property laws.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">6. Privacy Policy</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            6.1 Our{" "}
            <a href="/privacy" className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
              Privacy Policy
            </a>{" "}
            governs the collection, use, and disclosure of personal information provided by you. By using the App,
            you consent to the practices described in our Privacy Policy.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">7. Disclaimer of Warranty</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            7.1 The App is provided on an &quot;as-is&quot; and &quot;as available&quot; basis. We make no
            warranties, whether express or implied, including but not limited to warranties of merchantability,
            fitness for a particular purpose, and non-infringement. We do not warrant that the App will be
            error-free or uninterrupted.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">8. No Official Representation</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            8.1 The App is not an official product, channel, spokesperson, or representative of any person,
            community, organization, brand, government authority, political movement, religious entity, or other
            group. Any resemblance, reference, or mention does not imply endorsement, approval, partnership,
            sponsorship, or official association.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">9. No Religious Authority or Scholarly Certification</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            9.1 While this App may provide features, content, or tools intended to support an Islamic lifestyle, the
            App does not claim religious authority and has not been formally validated, audited, approved, or
            supervised by Islamic scholars, muftis, Sharia boards, or religious institutions unless expressly
            disclosed.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            9.2 Content generated, displayed, or suggested by the App may be incomplete, generalized, or inaccurate
            from a religious perspective. Users should independently verify religious matters and consult qualified
            Islamic scholars for binding guidance, interpretation, or religious decision-making.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">10. Limitation of Liability</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            10.1 In no event shall we be liable for any indirect, incidental, special, or consequential damages
            arising out of or in connection with the use of the App, even if we have been advised of the possibility
            of such damages.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">11. Indemnification</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            11.1 You agree to indemnify and hold us harmless from and against any claims, liabilities, damages,
            losses, and expenses, including attorneys&apos; fees, arising out of your use of the App, violation of
            these Terms, or violation of any rights of another.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">12. Modifications to the Terms</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            12.1 We reserve the right to update or modify these Terms at any time without prior notice. The most
            current version of the Terms will be available on our website. Your continued use of the App after any
            changes to the Terms constitutes acceptance of those changes.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">13. Termination</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            13.1 We may, in our sole discretion, terminate or suspend your access to the App at any time and for any
            reason, without liability or prior notice.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">14. Governing Law</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            14.1 These Terms shall be governed by and construed in accordance with the laws of Indonesia, without
            regard to its conflict of laws principles.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">15. Contact Us</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            15.1 If you have any questions or concerns about these Terms or our Service, please contact us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>

          <p className="text-lg text-gray-600 dark:text-gray-300 mt-12 leading-relaxed">
            By using our App, you acknowledge that you have read, understood, and agreed to these Terms of Service.
          </p>
        </article>
      </main>
      <Footer currentLang="en" />
    </div>
  );
}
