import { ArrowUp, Mail, Camera } from "lucide-react";
import { SUPPORT_EMAIL, withBase } from "@/config";

export default function Footer({ currentLang = "en" }: { currentLang?: string }) {
  const content = {
    en: {
      description: "Organize your day around prayers",
      quickLinks: {
        title: "Quick Links",
        links: [
          { name: "Download", href: "/download" },
          { name: "About", href: "/about" },
          { name: "Features", href: "/features" },
          { name: "Help", href: "/help" },
        ],
      },
      legal: {
        title: "Legal",
        links: [
          { name: "Privacy Policy", href: "/privacy" },
          { name: "Terms of Service", href: "/terms" },
        ],
      },
      contact: {
        title: "Connect",
        description: "Have questions or feedback? We'd love to hear from you.",
        email: SUPPORT_EMAIL,
      },
      copyright: "© 2024 Hvsna. All rights reserved.",
      backToTop: "Back to top",
    },
    id: {
      description: "Atur jadwal harian, berdasarkan waktu shalat.",
      quickLinks: {
        title: "Tautan Cepat",
        links: [
          { name: "Unduh", href: "/id/download" },
          { name: "Tentang", href: "/id/about" },
          { name: "Fitur", href: "/id/features" },
          { name: "Bantuan", href: "/help" },
        ],
      },
      legal: {
        title: "Legal",
        links: [
          { name: "Kebijakan Privasi", href: "/id/privacy" },
          { name: "Syarat Layanan", href: "/id/terms" },
        ],
      },
      contact: {
        title: "Hubungi",
        description: "Punya pertanyaan atau masukan? Kami senang mendengar dari Anda.",
        email: SUPPORT_EMAIL,
      },
      copyright: "© 2026 Hvsna. Semua hak dilindungi.",
      backToTop: "Kembali ke atas",
    },
  };

  const t = content[currentLang as keyof typeof content];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-4">
            <div className="flex items-center space-x-2 mb-4">
              <img src={withBase("/icon-192.png")} alt="Hvsna logo" width={32} height={32} className="rounded-lg" />
              <span className="text-xl font-bold">Hvsna</span>
            </div>
            <p className="text-sm mb-4">{t.description}</p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/hvsna.app/" className="text-gray-600 hover:text-primary-400 transition-colors" aria-label="Instagram">
                <Camera className="w-5 h-5" />
              </a>
              <a href={`mailto:${t.contact.email}`} className="hover:text-primary-400 transition-colors" aria-label="Email">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t.quickLinks.title}</h3>
            <ul className="space-y-2">
              {t.quickLinks.links.map((link, index) => (
                <li key={index}>
                  <a href={withBase(link.href)} className="hover:text-primary-400 transition-colors text-sm">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t.legal.title}</h3>
            <ul className="space-y-2">
              {t.legal.links.map((link, index) => (
                <li key={index}>
                  <a href={withBase(link.href)} className="hover:text-primary-400 transition-colors text-sm">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-2">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t.contact.title}</h3>
            <p className="text-sm mb-4">{t.contact.description}</p>
            <a href={`mailto:${t.contact.email}`} className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium">
              {t.contact.email}
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row gap-4 justify-between items-center text-center">
          <p className="text-sm">{t.copyright}</p>

          <button
            onClick={scrollToTop}
            className="flex items-center space-x-2 hover:text-primary-400 transition-colors text-sm"
            aria-label={t.backToTop}
          >
            <span>{t.backToTop}</span>
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
