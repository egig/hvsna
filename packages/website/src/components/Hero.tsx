import { Link } from "react-router";
import { Download } from "lucide-react";

export default function Hero({ currentLang = "en" }: { currentLang?: string }) {
  const content = {
    en: {
      title: "Organize your day around prayers",
      subtitle:
        "Prayer-first task app with Hijri calendar awareness. Finally, a productivity tool that works with your faith first.",
      primaryCTA: "Download",
      comingSoon: "Free on Android. iOS app is coming soon.",
    },
    id: {
      title: "Atur jadwal harian, berdasarkan waktu sholat",
      subtitle:
        "Aplikasi task berbasis sholat dengan dukungan kalender Hijriah. Akhirnya, alat produktivitas yang bekerja sesuai tujuan hidup kita.",
      primaryCTA: "Unduh",
      comingSoon: "Gratis di Android. Aplikasi iOS akan segera hadir.",
    },
  };

  const t = content[currentLang as keyof typeof content];
  const downloadHref = currentLang === "id" ? "/id/download" : "/download";

  return (
    <section className="relative overflow-hidden">
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-32">
        <div className="space-y-10 sm:space-y-12">
          {/* Content */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 text-balance">
              {t.title}
            </h1>

            <p className="text-lg  text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed text-pretty">
              {t.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
              <Link
                to={downloadHref}
                className="inline-flex h-12 w-full max-w-xs sm:w-auto items-center justify-center px-6 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-5 h-5 mr-2 shrink-0" />
                {t.primaryCTA}
              </Link>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">{t.comingSoon}</p>
          </div>

          <img
            src="/images/hvsna-hero.webp"
            alt="Hvsna app showing today's prayer-anchored tasks"
            className="mx-auto w-full max-w-2xl rounded-xl"
          />
        </div>
      </div>
    </section>
  );
}
