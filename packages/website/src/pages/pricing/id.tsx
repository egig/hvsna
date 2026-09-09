import { Link } from "react-router";
import { Check, Download } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SUPPORT_EMAIL, WEB_APP_SIGNUP_URL } from "@/config";
import { useSeo } from "@/seo/Seo";
import { usePricing, formatPrice } from "@/hooks/use-pricing";

export default function PricingPageID() {
  useSeo();
  const pricing = usePricing();

  const plans = [
    {
      name: "Gratis",
      price: "Gratis",
      period: "",
      description: "Tersedia sekarang di Android dan Web",
      features: [
        "Kalender Hijriah",
        "Penjadwalan berbasis waktu shalat",
        "Tugas tak terbatas",
        "Dukungan offline",
        "Aplikasi Android dan Web tersedia sekarang",
      ],
      cta: "Unduh",
      href: "/id/download",
      highlighted: false,
      badge: true,
      secondaryCta: "Coba di Web",
      secondaryHref: WEB_APP_SIGNUP_URL,
    },
    {
      name: "Sync",
      price: pricing ? formatPrice(pricing) : "Harga sederhana dan transparan",
      period: "",
      description: "Sinkronkan tugasmu antara Android dan Web",
      features: [
        "Semua fitur Gratis",
        "Sync antara Android & Web",
        "Aplikasi iOS (segera hadir)",
        "Dukungan prioritas",
        "Dukung pengembangan",
      ],
      cta: "Aktifkan Sync",
      href: WEB_APP_SIGNUP_URL,
      highlighted: true,
    },
  ];

  const faqs = [
    {
      question: "Apakah ada paket gratis?",
      answer:
        "Ya! Paket gratis memberikan akses penuh ke fitur inti di Android maupun Web, termasuk kalender Hijriah, penjadwalan berbasis waktu shalat, dan tugas tak terbatas. Sync menjaga data itu tetap sama di semua perangkat.",
    },
    {
      question: "Apakah data saya dijual?",
      answer:
        "Tidak pernah. Kami membiayai layanan ini melalui paket Sync, bukan dengan menjual data Anda. Data Anda tersimpan di perangkat kecuali Anda mengaktifkan Sync, dan bisa Anda hapus dari perangkat mana pun kapan saja.",
    },
    {
      question: "Apakah ada diskon pelajar?",
      answer: `Ya! Hubungi ${SUPPORT_EMAIL} dan kami akan memberikan kode diskon untuk Anda.`,
    },
    {
      question: "Platform apa saja yang didukung?",
      answer: "Hvsna tersedia sekarang di Android dan Web. Aplikasi iOS akan segera hadir.",
    },
    {
      question: "Bagaimana cara mulai menggunakan Sync?",
      answer: "Buat akun di Web atau di aplikasi Android, lalu aktifkan Sync dari Pengaturan untuk menjaga tugasmu tetap sama di semua perangkat.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header currentLang="id" />
      <main>
        {/* Hero */}
        <section className="py-16 lg:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">Paket untuk semua</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">Tidak perlu kartu kredit untuk mendaftar, batalkan kapan saja</p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-16 lg:pb-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-6 flex flex-col ${
                    plan.highlighted
                      ? "bg-primary-600 text-white ring-2 ring-primary-600 shadow-xl md:scale-[1.02]"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-2 ${plan.highlighted ? "text-primary-100" : "text-gray-500 dark:text-gray-400"}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline">
                      <span className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-gray-900 dark:text-white"}`}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className={`ml-1 text-sm ${plan.highlighted ? "text-primary-200" : "text-gray-500 dark:text-gray-400"}`}>
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className={`mt-2 text-sm ${plan.highlighted ? "text-primary-100" : "text-gray-500 dark:text-gray-400"}`}>
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-yellow-300" : "text-primary-500"}`} />
                        <span className={`text-sm ${plan.highlighted ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.badge ? (
                    <div className="space-y-3">
                      <Link
                        to={plan.href}
                        className="flex w-full items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        {plan.cta}
                      </Link>
                      {plan.secondaryHref && (
                        <a
                          href={plan.secondaryHref}
                          className="block w-full text-center py-3 px-4 rounded-lg font-semibold border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                        >
                          {plan.secondaryCta}
                        </a>
                      )}
                    </div>
                  ) : (
                    <a
                      href={plan.href}
                      className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                        plan.highlighted ? "bg-white text-primary-600 hover:bg-primary-50" : "bg-primary-600 text-white hover:bg-primary-700"
                      }`}
                    >
                      {plan.cta}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-16 lg:pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Pertanyaan yang sering diajukan</h2>
            <div className="space-y-8">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer currentLang="id" />
    </div>
  );
}
