import { ArrowUp, Mail, Camera } from "lucide-react";
import { SUPPORT_EMAIL } from "@/config";

export default function Footer({ currentLang = "en" }: { currentLang?: string }) {
  const content = {
    en: {
      description: "Organize your day around prayers",
      quickLinks: {
        title: "Quick Links",
        links: [
          { name: "About", href: "/about" },
          { name: "Pricing", href: "/pricing" },
          { name: "Features", href: "/features" },
          { name: "Help", href: "/help" },
        ],
      },
      legal: {
        title: "Legal",
        links: [
          { name: "Privacy Policy", href: "/privacy" },
          { name: "Terms of Service", href: "/terms" },
          { name: "Delete Account", href: "/opt-out" },
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
          { name: "Tentang", href: "/id/about" },
          { name: "Harga", href: "/id/pricing" },
          { name: "Fitur", href: "/id/features" },
          { name: "Bantuan", href: "/help" },
        ],
      },
      legal: {
        title: "Legal",
        links: [
          { name: "Kebijakan Privasi", href: "/id/privacy" },
          { name: "Syarat Layanan", href: "/id/terms" },
          { name: "Hapus Akun", href: "/opt-out" },
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
    <footer className="bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/icon-192.png" alt="Hvsna logo" width={32} height={32} className="rounded-lg" />
              <span className="text-xl font-bold">Hvsna</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">{t.description}</p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/hvsna.app/" className="text-gray-400 hover:text-primary-400 transition-colors" aria-label="Instagram">
                <Camera className="w-5 h-5" />
              </a>
              <a href={`mailto:${t.contact.email}`} className="text-gray-400 hover:text-primary-400 transition-colors" aria-label="Email">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t.quickLinks.title}</h3>
            <ul className="space-y-2">
              {t.quickLinks.links.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t.legal.title}</h3>
            <ul className="space-y-2">
              {t.legal.links.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t.contact.title}</h3>
            <p className="text-gray-400 text-sm mb-4">{t.contact.description}</p>
            <a href={`mailto:${t.contact.email}`} className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium">
              {t.contact.email}
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 sm:mb-0">{t.copyright}</p>

          <button
            onClick={scrollToTop}
            className="flex items-center space-x-2 text-gray-400 hover:text-primary-400 transition-colors text-sm"
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
