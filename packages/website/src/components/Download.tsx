import { Apple, Check } from "lucide-react";
import { PLAY_STORE_URL, withBase } from "@/config";

const content = {
  en: {
    title: "Download Hvsna",
    subtitle: "Free on Android. Your data stays on your device and works offline.",
    availableLabel: "Available now",
    comingSoonLabel: "Coming soon",
    android: {
      name: "Android",
      description: "Get the native app from Google Play.",
    },
    ios: {
      name: "iOS",
      description: "The iPhone and iPad app is in the works.",
    },
    footnote: "Prefer to read more first?",
    footnoteLink: "See all features",
    footnoteHref: "/features",
  },
  id: {
    title: "Unduh Hvsna",
    subtitle: "Gratis di Android. Datamu tersimpan di perangkatmu dan bekerja offline.",
    availableLabel: "Tersedia sekarang",
    comingSoonLabel: "Segera hadir",
    android: {
      name: "Android",
      description: "Dapatkan aplikasi native dari Google Play.",
    },
    ios: {
      name: "iOS",
      description: "Aplikasi iPhone dan iPad sedang dikembangkan.",
    },
    footnote: "Ingin tahu lebih dulu?",
    footnoteLink: "Lihat semua fitur",
    footnoteHref: "/id/features",
  },
};

function StatusPill({ available, label }: { available: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        available
          ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {available && <Check className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default function Download({ currentLang = "en" }: { currentLang?: string }) {
  const t = content[currentLang as keyof typeof content] ?? content.en;

  return (
    <section className="py-14 sm:py-20 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 text-balance">{t.title}</h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed text-pretty">
            {t.subtitle}
          </p>
        </div>

        <div className="space-y-4">
          {/* Android */}
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.android.name}</h2>
                <StatusPill available label={t.availableLabel} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t.android.description}</p>
            </div>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center self-start sm:self-center"
            >
              <img src={withBase("/GetItOnGooglePlay_Badge_Web_color_English.svg")} alt="Get it on Google Play" className="h-12 w-auto" />
            </a>
          </div>

          {/* iOS */}
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.ios.name}</h2>
                <StatusPill available={false} label={t.comingSoonLabel} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t.ios.description}</p>
            </div>
            <span className="inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-gray-200 px-5 font-medium text-gray-400 dark:border-gray-700 sm:self-center">
              <Apple className="w-5 h-5" />
              {t.comingSoonLabel}
            </span>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
          {t.footnote}{" "}
          <a href={withBase(t.footnoteHref)} className="text-primary-600 dark:text-primary-400 underline hover:no-underline">
            {t.footnoteLink}
          </a>
        </p>
      </div>
    </section>
  );
}
