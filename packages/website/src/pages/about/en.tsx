import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SUPPORT_EMAIL, WEB_APP_SIGNUP_URL } from "@/config";
import { useSeo } from "@/seo/Seo";

export default function AboutPage() {
  useSeo();
  return (
    <div className="min-h-screen">
      <Header currentLang="en" />
      <main>
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16 lg:py-32">
          <h1 className="text-4xl sm:text-5xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6">About Hvsna</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Hvsna, is creative respelling of "Husna", means "Best" or "Excellent" in Arabic. The name was chosen to
            reflect the app's mission to help users becomes better every day.
          </p>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Hvsna helps you organize your day around salah. Because we believe that thats the best way to organize
            our day. Salah is the first priority of a Muslim, and it should be the first thing we do and plan for the
            day.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">The Problem</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Too often, our ibadah goes unplanned — we move through the day without a clear structure for our worship.
            Meetings and commitments end up clashing with prayer times, pushing salah to the margins instead of
            keeping it at the center. And when it comes to acts of worship beyond the obligatory, we lose track of
            our intentions entirely. Without a system designed around our deen, these problems quietly persist.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">The Vision</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Hvsna is built from the ground up around Islamic values — not retrofitted onto an existing template.
            Tasks are anchored to prayer times. Hijri dates are displayed alongside the civil calendar. Everything is
            designed so that your deen comes first, and your productivity flows naturally from it.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">How It Works</h2>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start text-lg text-gray-600 dark:text-gray-300">
              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
              <span>
                <strong className="text-gray-900 dark:text-white">Hijri calendar awareness</strong> — Islamic dates
                displayed alongside civil calendar dates.
              </span>
            </li>
            <li className="flex items-start text-lg text-gray-600 dark:text-gray-300">
              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
              <span>
                <strong className="text-gray-900 dark:text-white">Prayer-first scheduling</strong> — Plan your tasks
                between salah times so prayer stays at the center of your day.
              </span>
            </li>
            <li className="flex items-start text-lg text-gray-600 dark:text-gray-300">
              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
              <span>
                <strong className="text-gray-900 dark:text-white">Simple, accessible, and focused UI</strong> — See
                today and upcoming tasks at a glance with zero clutter.
              </span>
            </li>
            <li className="flex items-start text-lg text-gray-600 dark:text-gray-300">
              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
              <span>
                <strong className="text-gray-900 dark:text-white">Offline-first</strong> — Works without an internet
                connection, with optional cross-device Sync when you want it.
              </span>
            </li>
          </ul>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">Where We Are</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Hvsna is available now on Android — get it on{" "}
            <a
              href="https://play.google.com/store/apps/details?id=com.hvsna.app"
              target="_blank"
              rel="noreferrer"
              className="text-primary-600 dark:text-primary-400 underline hover:no-underline"
            >
              Google Play
            </a>{" "}
            — and on the{" "}
            <a
              href={WEB_APP_SIGNUP_URL}
              className="text-primary-600 dark:text-primary-400 underline hover:no-underline"
            >
              Web
            </a>
            . Sync keeps your tasks in step across both. iOS is coming soon. We are actively building and
            improving — your feedback helps shape what comes next.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">Get in Touch</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Have questions, feedback, or just want to say salaam? Reach out at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </article>
      </main>
      <Footer currentLang="en" />
    </div>
  );
}
