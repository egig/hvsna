import { ArrowRight, Play } from "lucide-react";

export default function Hero({ currentLang = "en" }: { currentLang?: string }) {
  const content = {
    en: {
      title: "Organize your day around prayers",
      subtitle:
        "Prayer-first task app with Hijri calendar awareness. Finally, a productivity tool that works with your faith first.",
      primaryCTA: "Get it on Google Play",
      secondaryCTA: "Learn More",
      comingSoon: "iOS, Web, and Sync are coming soon",
    },
    id: {
      title: "Atur jadwal harian, berdasarkan waktu sholat",
      subtitle:
        "Aplikasi task berbasis sholat dengan dukungan kalender Hijriah. Akhirnya, alat produktivitas yang bekerja sesuai tujuan hidup kita.",
      primaryCTA: "Dapatkan di Google Play",
      secondaryCTA: "Pelajari Lebih Lanjut",
      comingSoon: "iOS, Web, dan Sync akan segera hadir",
    },
  };

  const t = content[currentLang as keyof typeof content];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 lg:py-32">
        <div className="space-y-12">
          {/* Content */}
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">{t.title}</h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">{t.subtitle}</p>

            {/* CTAs */}
            <div className="flex flex-row gap-4 justify-center">
              <a href="https://play.google.com/store/apps/details?id=com.hvsna.app" target="_blank" rel="noreferrer" className="inline-flex items-center">
                <img src="/GetItOnGooglePlay_Badge_Web_color_English.svg" alt={t.primaryCTA} className="h-14 w-auto" />
              </a>

              <a
                href="/about"
                className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Play className="w-5 h-5 mr-2" />
                {t.secondaryCTA}
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">{t.comingSoon}</p>
          </div>

          <img
            src="/android-today.png"
            alt="Hvsna app showing today's prayer-anchored tasks"
            className="mx-auto w-full max-w-xs sm:max-w-sm"
          />
        </div>
      </div>
    </section>
  );
}
