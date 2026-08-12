import { ArrowRight, Check } from "lucide-react";

export default function CTA({ currentLang = "en" }: { currentLang?: string }) {
  const content = {
    en: {
      title: "Get your day organized",
      subtitle: "Join other Muslims who are already organizing their days the Islamic way",
      features: ["Free to download and use", "No ads or distractions", "Your data stays private", "Works perfectly offline"],
      primaryCTA: "Get it on Google Play",
      secondaryCTA: "Learn More",
      comingSoon: "iOS, Web, and Sync are coming soon",
    },
    id: {
      title: "Buat harimu lebih teratur",
      subtitle: "Bergabunglah dengan  Muslim lainnya yang sudah mengatur hari mereka secara Islami",
      features: ["Gratis untuk diunduh dan digunakan", "Tanpa iklan atau gangguan", "Datamu tetap privat", "Bekerja sempurna offline"],
      primaryCTA: "Dapatkan di Google Play",
      secondaryCTA: "Lebih Detail",
      comingSoon: "iOS, Web, dan Sync akan segera hadir",
    },
  };

  const t = content[currentLang as keyof typeof content];

  return (
    <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t.title}</h2>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left - Features */}
          <div>
            <ul className="space-y-4">
              {t.features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-yellow-300" />
                  </div>
                  <span className="text-primary-50">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right - CTAs */}
          <div className="text-center md:text-left">
            <div className="space-y-4">
              <a
                href="https://play.google.com/store/apps/details?id=com.hvsna.app"
                className="inline-flex items-center justify-center md:justify-start"
              >
                <img src="/GetItOnGooglePlay_Badge_Web_color_English.svg" alt={t.primaryCTA} className="h-14 w-auto" />
              </a>

              <a
                href="/about"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-primary-700 text-white font-semibold rounded-lg hover:bg-primary-800 transition-colors border border-primary-500"
              >
                {t.secondaryCTA}
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </div>

            <p className="text-primary-100 text-sm mt-6">{t.comingSoon}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
