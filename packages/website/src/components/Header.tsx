import { useState } from "react";
import { Link } from "react-router";
import { Menu, X, Globe, Download } from "lucide-react";

export default function Header({ currentLang = "en", doc = false }: { currentLang?: string, doc?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const content = {
    en: {
      nav: {
        features: "Features",
        about: "About",
        blog: "Blog",
        changelog: "Changelog",
      },
      language: "Language",
      download: "Download",
    },
    id: {
      nav: {
        features: "Fitur",
        about: "Tentang",
        blog: "Blog",
        changelog: "Catatan Perubahan",
      },
      language: "Bahasa",
      download: "Unduh",
    },
  };

  const t = content[currentLang as keyof typeof content];
  const downloadHref = currentLang === "id" ? "/id/download" : "/download";

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md font-bold">
      <div className={`${doc ? "max-w-6xl" : "max-w-3xl"} mx-auto px-4 sm:px-6`}>
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={currentLang === "id" ? "/id" : "/"} className="flex items-center space-x-2 outline-none">
            <img src="/icon-192.png" alt="Hvsna logo" width={32} height={32} className="rounded-lg" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Hvsna</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-primary-500 text-white px-1.5 py-0.5 rounded-full">Beta</span>
          </Link>

          {/* Right side controls */}
          <div className="flex items-center space-x-8">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link
                to={currentLang === "id" ? "/id/about" : "/about"}
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors outline-none hover:bg-primary-100 px-2 py-1 rounded-lg"
              >
                {t.nav.about}
              </Link>
            </nav>

            {/* Language Toggle */}
            <Link
              to={currentLang === "id" ? "/" : "/id"}
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors hover:bg-primary-100 px-2 py-1 rounded-lg"
              title={t.language}
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{currentLang === "id" ? "EN" : "ID"}</span>
            </Link>

            {/* Download CTA */}
            <Link
              to={downloadHref}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-primary-600 px-4 py-2 text-sm font-semibold text-primary-600 dark:text-primary-400 dark:border-primary-400 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/30"
            >
              <Download className="w-4 h-4" />
              {t.download}
            </Link>

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
                to={downloadHref}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                onClick={() => setIsMenuOpen(false)}
              >
                <Download className="w-4 h-4" />
                {t.download}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
