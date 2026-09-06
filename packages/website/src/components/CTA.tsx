import { Link } from "react-router";
import { ArrowRight, Check, Download } from "lucide-react";
import { WEB_APP_SIGNUP_URL } from "@/config";

export default function CTA({ currentLang = "en" }: { currentLang?: string }) {
  const content = {
    en: {
      title: "Get your day organized",
      subtitle: "Join other Muslims who are already organizing their days the Islamic way",
      features: ["Free on Android and Web", "No ads or distractions", "Your data stays private", "Works perfectly offline"],
      primaryCTA: "Download",
      secondaryCTA: "Try it on Web",
      comingSoon: "iOS app is coming soon. Sync across devices with a Sync plan.",
    },
    id: {
      title: "Buat harimu lebih teratur",
      subtitle: "Bergabunglah dengan  Muslim lainnya yang sudah mengatur hari mereka secara Islami",
      features: ["Gratis di Android dan Web", "Tanpa iklan atau gangguan", "Datamu tetap privat", "Bekerja sempurna offline"],
      primaryCTA: "Unduh",
      secondaryCTA: "Coba gratis",
      comingSoon: "Aplikasi iOS akan segera hadir. Sinkronkan antar perangkat dengan paket Sync.",
    },
  };

  const t = content[currentLang as keyof typeof content];
  const downloadHref = currentLang === "id" ? "/id/download" : "/download";

  return (
    <section className="py-14 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">{t.title}</h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed text-pretty">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left - Features */}
          <div>
            <ul className="space-y-3 sm:space-y-4">
              {t.features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right - CTAs */}
          <div className="text-center md:text-left">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center md:items-start">
              <Link
                to={downloadHref}
                className="inline-flex h-12 w-full max-w-xs sm:w-auto items-center justify-center px-6 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-5 h-5 mr-2 shrink-0" />
                {t.primaryCTA}
              </Link>

              <a
                href={WEB_APP_SIGNUP_URL}
                className="inline-flex h-12 w-full max-w-xs sm:w-auto items-center justify-center px-5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t.secondaryCTA}
                <ArrowRight className="w-5 h-5 ml-2 shrink-0" />
              </a>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">{t.comingSoon}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
