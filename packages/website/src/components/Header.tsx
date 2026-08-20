import { useState } from "react";
import { Link } from "react-router";
import { Moon, Sun, Menu, X, Globe } from "lucide-react";
import { useTheme } from "@/theme/theme-provider";
import { WEB_APP_SIGNUP_URL } from "@/config";

export default function Header({ currentLang = "en", doc = false }: { currentLang?: string, doc?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const content = {
    en: {
      nav: {
        features: "Features",
        about: "About",
        pricing: "Pricing",
        blog: "Blog",
        changelog: "Changelog",
        webApp: "Web App",
      },
      language: "Language",
      download: "Download",
      signIn: "Sign In",
    },
    id: {
      nav: {
        features: "Fitur",
        about: "Tentang",
        pricing: "Harga",
        blog: "Blog",
        changelog: "Catatan Perubahan",
        webApp: "Web App",
      },
      language: "Bahasa",
      download: "Unduh",
      signIn: "Masuk",
    },
  };

  const t = content[currentLang as keyof typeof content];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className={`${doc ? "max-w-6xl" : "max-w-3xl"} mx-auto px-4 sm:px-6`}>
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={currentLang === "id" ? "/id" : "/"} className="flex items-center space-x-2 outline-none">
            <img src="/icon-192.png" alt="Hvsna logo" width={32} height={32} className="rounded-lg" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Hvsna</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-primary-500 text-white px-1.5 py-0.5 rounded-full">Beta</span>
          </Link>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link
                to={currentLang === "id" ? "/id/about" : "/about"}
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors outline-none"
              >
                {t.nav.about}
              </Link>
              <Link
                to={currentLang === "id" ? "/id/pricing" : "/pricing"}
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors outline-none"
              >
                {t.nav.pricing}
              </Link>
            </nav>

            {/* Language Toggle */}
            <Link
              to={currentLang === "id" ? "/" : "/id"}
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              title={t.language}
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{currentLang === "id" ? "EN" : "ID"}</span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Download Button (Desktop) */}
            <a href="https://play.google.com/store/apps/details?id=com.hvsna.app" target="_blank" rel="noreferrer" className="hidden md:block">
              <img src="/GetItOnGooglePlay_Badge_Web_color_English.svg" alt={t.download} className="h-10 w-auto" />
            </a>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-4">
              <Link
                to={currentLang === "id" ? "/id/about" : "/about"}
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors outline-none"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.nav.about}
              </Link>
              <Link
                to={currentLang === "id" ? "/id/pricing" : "/pricing"}
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors outline-none"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.nav.pricing}
              </Link>
              <a
                href={WEB_APP_SIGNUP_URL}
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors outline-none"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.nav.webApp} — {t.signIn}
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
